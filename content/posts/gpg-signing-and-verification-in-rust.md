---
title: "Writing custom PAMs in Rust"
date: 2022-11-09T10:20:00+02:00
draft: true
cover: "/writing-pams-in-rust/cover.png"
coverCaption: "Photo by Michael Dziedzic on Unsplash"
images:
  - "/writing-pams-in-rust/cover.png"
---

## Digital PGP signing

At this stage every single person who has a file named `pizza.txt` containing the text `I love pizza` on their USB will be authenticated. But let's say you are the authority on deciding who loves pizza and who doesn't, and you want to certify certain people. A good way to do so would be to digitally sign the `pizza.txt` file with a private key you keep secret, and then have a public key verifying if the signature matches the contents of the file. While we're at it we can also implement some sort of identification system - let me explain.

We're going to replace the `pizza.txt` file with an `identity.json`, which will contain the following data:

```json
{
	"name": "Mike Wazowski",
	"expiration_timestamp": 1670670217
}
```

During authentication we're going to check whether `expiration_timestamp` (seconds since UNIX epoch) is in the past and will not allow entry if so. Nothing's stopping you from implementing other auth criteria like whether the USB's serial ID matches the one mentioned in the JSON file - that should prevent copying the identity and signature files to other flash drives.

First of all we'll need to create a PGP key-pair:

```bash
gpg --gen-key
```

Type in your name and e-mail, but leave the passphrase empty. Truth be told, I haven't experimented much with password-protected keys and it might add some overhead in our program. That's why I'll leave it blank, but you can definitely try it for yourself.

Afterwards you can list all the available keys and, lo and behold, your key should be right there.

```
$ gpg --list-keys
...
pub   rsa3072 2022-11-10 [SC] [expires: 2024-11-09]
      DADFBBF4B99C7707D4844B7083AFD6131FAAF98E
uid           [ultimate] Adam Pisula <me@adampisula.pizza>
sub   rsa3072 2022-11-10 [E] [expires: 2024-11-09]
```

Now let's export the public key to a file (`--armor` makes the output human-readable):

```bash
gpg --armor --output my_pub_key.gpg --export me@adampisula.pizza
```

The `my_pub_key.gpg` file should look something like this:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQGNBGNs6+EBDADt5a9qfCqlNc8T9YiKeBR/XpDcP4NyLEgyf+AnOIbLKAPtVcvC
...
=8kjE
-----END PGP PUBLIC KEY BLOCK-----
```

Now copy this file to your VM and run:

```bash
gpg --import my_pub_key.gpg
```

So now when you run `gpg --list-keys` on your VM, one of the entries on the list should be your newly created pubkey.

With the secret and public key in place, we can proceed to sign your `identity.json` file with the secret key (on your machine, not the VM):

```bash
gpg --armor --output identity.sig --detach-sig identity.json
```

This will create an `identity.sig` file (in a human-friendly format thanks to `--armor`) which we'll use to verify if contents of `identity.json` have not been altered. Copy both `identity.json` and `identity.sig` files onto your flash drive and let's continue coding.

## Verifying file's signature in Rust

To verify the PGP signature, we're going to use `sequoia-openpgp` as I found it the easiest to use for what we're trying to do here.