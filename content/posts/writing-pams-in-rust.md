---
title: "Writing custom PAMs in Rust"
date: 2022-11-09T10:20:00+02:00
draft: true
cover: "/writing-pams-in-rust/cover.png"
images:
  - "/writing-pams-in-rust/cover.png"
---

## What is a PAM module?

Authentication in Linux is achieved through the use of PAMs (**P**luggable **A**uthentication **M**odules) - you can think of them as a program giving a user either a green or a red light based on the credentials they provided. I am by no means a Linux expert, but I'll do my best to explain the subject as clearly as possible.

Thanks to the way PAMs work, you are not limited to the default login-password authentication - nothing's stopping you from implementing a web-based (perhaps an external API?), facial recognition, or physical key auth.

To find the directory on your PC containing all available PAMs, simply run the following in your terminal:

```bash
find / -path "*/security/pam_exec.so" 2> /dev/null
```

What the command above does is it looks for a `pam_exec.so` file inside a `security` directory. Depending on your CPU architecture you should get something like this:

```
/usr/lib/x86_64-linux-gnu/security/pam_access.so
```

Now that we've located where our PAMs live, go ahead and list what's in the `security` folder:

```bash
ls -1 /usr/lib/x86_64-linux-gnu/security/
```

and after that you should get something similar to the following:

```
pam_access.so
pam_cap.so
pam_debug.so
...
pam_warn.so
pam_wheel.so
pam_xauth.so
```

As you can see, PAMs are `.so` files meaning they are *shared objects*. It's fairly easy to compile C/C++ code into a `.so` file (take a look at [this repository](https://github.com/beatgammit/simple-pam)) and luckily for us, the Rust compiler also provides a way to compile your code into a *shared object* which we'll do next.

## The Plan

My use-case is authenticating a user based on a signed text file on an external USB, but depending on what you want to do, you can just replace my code with what suits you best.

Our step-by-step plan looks as follows:
  
  1. Writing a test in C++ so we don't have to log out every time we make a change.
  2. Most basic PAM in Rust.
  3. Configuring Linux to use our PAM.

The steps below are optional and specific to my use-case, but you can follow along if you feel like it:

  4. Mounting a flash drive.
  5. Reading and verifying the contents of a file on the USB.
  6. Digitally signing our file.
  7. Verifying the file's signature.

With the plan laid out, let's start coding.

## Test script

I certainly do *not* recommend doing any of it on your PC, because it's very easy and pretty likely to break something and you might not be able to log into your account afterwards. I spun up a virtual machine with Debian installed (bullseye, no desktop environment) and will do all of my development there.

You might need to install a couple libraries to make this script work. For my Debian install, I ran:

```bash
apt install libpam0g-dev
```

The script below comes from the [repository](https://github.com/beatgammit/simple-pam) I linked earlier.

```cpp {title="test.cpp"}
// test.cpp

#include <security/pam_appl.h>
#include <security/pam_misc.h>
#include <stdio.h>

const struct pam_conv conv = {
	misc_conv,
	NULL
};

int main(int argc, char *argv[]) {
	pam_handle_t* pamh = NULL;
	int retval;
	const char* user = "";

	if(argc != 2) {
		printf("Usage: ./test [username]\n");
		exit(1);
	}

    // Get user from CLI arguments
	user = argv[1];

    // Start authentication for the specified user with the default PAM
	retval = pam_start("check_user", user, &conv, &pamh);

	// Is authentication possible?
	if (retval == PAM_SUCCESS) {
		printf("T: Authentication started.\n");
		retval = pam_authenticate(pamh, 0);
	}

    // Can the account be used?
	if (retval == PAM_SUCCESS) {
		printf("T: Account is valid.\n");
		retval = pam_acct_mgmt(pamh, 0);
	}

	// Did everything work?
	if (retval == PAM_SUCCESS) {
		printf("T: Authenticated.\n");
	} else {
		printf("T: Not authenticated.\n");
	}

	// Close PAM (end session)
	if (pam_end(pamh, retval) != PAM_SUCCESS) {
		pamh = NULL;
		printf("T: 'check_user' failed to release authenticator.\n");
		exit(1);
	}

	return retval == PAM_SUCCESS ? 0 : 1;
}
```

Let's compile it real quick and give it a test run with the system's default PAM (password-based):

```bash
g++ -o ./test ./test.cpp -lpam -lpam_misc
./test $USER
```

Hopefully it compiled successfully and you've been prompted for your password.

## Rust code

Now that we can test the PAMs we write, let's get down to the actual Rust code.

First, make sure you have Rust installed and updated:

```bash
rustup update
```

If you don't have it installed yet, just follow the guide on [rust-lang.org](https://www.rust-lang.org/tools/install).

The crate we're going to use for interfacing with PAM is [`pam-bindings`](https://crates.io/crates/pam-bindings). It's not very popular, but it does the job - it's very likely there are better libraries out there, but most of them seem to **use** PAM to authenticate a user inside the app, instead of being able to do PAM authentication on their own.

Let's create a new Rust project and see what we can come up with:

```bash
cargo new custom-pam --lib
```

Note we want this project to be a library since we're going to compile it into `.so` file further down the line.

`cd` into the project and edit the `Cargo.toml` file to be as follows:

```toml
# Cargo.toml

[package]
name = "custom-pam"
version = "0.1.0"
edition = "2021"

[lib]
name = "custom_pam"
# "cdylib" will allow us to compile into .so
crate-type = ["cdylib"]  

[dependencies]
pam-bindings = "0.1.1"
```

Clear the contents of `src/lib.rs`:

```bash
echo > src/lib.rs
```

Now open it and write the following code:

```rust
// src/lib.rs

extern crate pam;

use pam::constants::{PamFlag, PamResultCode, PAM_PROMPT_ECHO_ON};
use pam::module::{PamHandle, PamHooks};
use pam::conv::Conv;
use pam::pam_try;
use std::ffi::CStr;

struct CustomPam;
pam::pam_hooks!(CustomPam);

impl PamHooks for CustomPam {
	fn sm_authenticate(pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		// Initialize PAM conversation
		let conv = match pamh.get_item::<Conv>() {
			Ok(Some(conv)) => conv,
			Ok(None) => {
				unreachable!("Conv not available.");
			},
			Err(err) => {
				eprintln!("Could not get pam_conv.");
				return err;
			},
		};

		// Ask for input
		let response = pam_try!(
			conv.send(
				PAM_PROMPT_ECHO_ON, // Input not concealed
				"I'm the Linux Auth fairy. Say the magic word and I'll let you in: "
			)
		);

		match response {
			Some(c_str) => {
				let text = String::from_utf8_lossy(c_str.to_bytes());

				if text == "please" {
					eprintln!("Oh, you're so kind!");
					return PamResultCode::PAM_SUCCESS;
				} else {
					eprintln!("'{}' is not the magic word! Say 'please'", text);
					return PamResultCode::PAM_AUTH_ERR;
				}
			},
			None => {
				eprintln!("No response!");
				PamResultCode::PAM_AUTH_ERR
			},
		}
	}

	fn sm_setcred(_pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		println!("Set credentials.");
		PamResultCode::PAM_SUCCESS
	}

	fn acct_mgmt(_pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		println!("Account management.");
		PamResultCode::PAM_SUCCESS
	}
}
```

And run:

```bash
cargo build
```

If the project compiled correctly, there should be a `libcustom_pam.so` file inside the `target/debug` directory.

Now copy the resulting `.so` file to the directory containing all PAM modules which in my case is `/usr/lib/x86_64-linux-gnu`. It seems the convention is to name the files there as `pam_foo.so`, so from now on we'll call our module `pam_custom.so`:

```bash
cp ./target/debug/libcustom_pam.so /usr/lib/x86_64-linux-gnu/pam_custom.so
```

## Configuring Linux to use the custom PAM

We need to let Linux know, that we want it to use our PAM. For now we'll make it so it falls back on the default password-based auth.

Open `/etc/pam.d/common-auth` in your text editor and add the following lines at the very beginning of the file:

```
auth sufficient pam_custom.so
account sufficient pam_custom.so
```

We'll dive deeper into what it does later, but for now let's just leave it at that.

You're now ready to test our custom PAM module. Run the test program we compiled earlier:

```bash
../test $USER
```

If you've typed in `please`, then our PAM will simply log you in, no questions asked. How cool is that? If not, however, it will fall back to password authentication.

## Mounting a flash drive using Rust

So now we know our PAM works, time to turn it into something useful. Say I wanted my PAM to only allow people with a physical key (e.g. a flash drive containing a file named `pizza.txt`). You could of course set up `autofs` and all that jazz, but let's do it my way - the dumb way.

To mount the flash drive we're going to use the `sys-mount` crate:

```toml
...

[dependencies]
pam-bindings = "0.1.1"
sys-mount = "2.0.1"
```

Let's remove the contents of the `sm_authenticate` method and write some new code to handle USBs and files:

```rust
// src/lib.rs

extern crate pam;
extern crate sys_mount;

use pam::constants::{PamFlag, PamResultCode, PAM_PROMPT_ECHO_OFF};
use pam::module::{PamHandle, PamHooks};
use pam::conv::Conv;
use pam::pam_try;
use std::ffi::CStr;
use std::fs::create_dir;
use std::path;
use sys_mount::{Mount, Unmount, UnmountFlags};

const DEVICE: &str = "/dev/sdb1";
const MOUNT_PATH: &str = "/tmp/auth_key";
const FILE_NAME: &str = "pizza.txt";

struct CustomPam;
pam::pam_hooks!(CustomPam);

impl PamHooks for CustomPam {
	fn sm_authenticate(pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		// Initialize PAM conversation
		let conv = match pamh.get_item::<Conv>() {
			Ok(Some(conv)) => conv,
			Ok(None) => {
				unreachable!("Conv not available.");
			},
			Err(err) => {
				eprintln!("Could not get pam_conv.");
				return err;
			},
		};

		// Remind the user to plug in their flash drive
		let _ = pam_try!(
			conv.send(
				PAM_PROMPT_ECHO_OFF, // Do NOT echo input
				"Plug in your physical key and press Enter..."
			)
		);

		// Create the mounting directory if doesn't exist
		if !path::Path::new(&MOUNT_PATH).exists() {
			create_dir(MOUNT_PATH)
				.expect("Could not create directory in /tmp");
		}

		// Mount the USB
		let mount_result = Mount::new( // You would most likely want to use Mount::builder() if you knew what the file system was beforehand
			DEVICE,
			MOUNT_PATH
		); 

		if mount_result.is_err() {
			eprintln!("There has been an error while mounting: {:?}", mount_result.unwrap_err());
			return PamResultCode::PAM_AUTH_ERR; // Do not proceed if mounting failed
		}

		let mounted_device = mount_result.unwrap();

		// Check if a file named 'pizza.txt' exists on the flash drive
		let file_present = path::Path::new(
			format!("{}/{}", MOUNT_PATH, FILE_NAME).as_str()
		).exists();

		// Unmount the USB
		mounted_device.unmount(UnmountFlags::DETACH)
			.expect("Failed to unmount device.");

		// Return authentication status
		if file_present {
			PamResultCode::PAM_SUCCESS
		} else {
			eprintln!("'{}/{}' either does not exist or is not accessible.", MOUNT_PATH, FILE_NAME);
			PamResultCode::PAM_AUTH_ERR
		}
	}

	fn sm_setcred(_pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		println!("Set credentials.");
		PamResultCode::PAM_SUCCESS
	}

	fn acct_mgmt(_pamh: &mut PamHandle, _args: Vec<&CStr>, _flags: PamFlag) -> PamResultCode {
		println!("Account management.");
		PamResultCode::PAM_SUCCESS
	}
}
```

That's a mouthful. Compile it and run it as so:

```bash
cargo build
../test $USER
```

Try plugging a USB with a file named `pizza.txt` on it, then remove it and run the test again. You should be authenticated and rejected respectively.

## Reading the file

Now let's say we only want to allow users where the `pizza.txt` file says `I love pizza`, cause why would you let people who don't love pizza onto your PC?

```rust
// src/lib.rs

// ...
use std::fs;
// ...

fn sm_authenticate(...) {
	// ...
	let mounted_device = mount_result.unwrap();

	// Read file contents to string and verify
	let auth_valid = match fs::read_to_string(
		format!("{}/{}", MOUNT_PATH, FILE_NAME)
	) {
		Ok(file_contents) => {
			if file_contents.contains("I love pizza") {
				true
			} else {
				eprintln!("File does not contain the phrase 'I love pizza'. File contents: {:?}", file_contents);
				false
			}
		},
		Err(err) => {
			eprintln!("There has been an error while accessing '{}/{}'. Error: {:?}", MOUNT_PATH, FILE_NAME, err);
			false
		},
	};

	// Unmount the USB
	mounted_device.unmount(UnmountFlags::DETACH)
		.expect("Failed to unmount device.");

	if auth_valid {
		PamResultCode::PAM_SUCCESS
	} else {
		PamResultCode::PAM_AUTH_ERR
	}
}
```