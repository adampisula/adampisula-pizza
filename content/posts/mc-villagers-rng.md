---
title: "Minecraft Villagers seeding an RNG"
date: 2022-09-28T11:21:50+02:00
draft: true
---

## Random vs chaotic

Some time ago I've had a very odd fascination with the concept of randomness and how it's impossible to achieve true randomness digitally. In most cases it's not necessary to have something truly random in our software, but there are cases when the impredictability of the result is paramount. Cloudflare, for example, got really creative with how they approached the issue, and have a wall in their office filled entirely with lava lamps (they wrote a [pretty good article](https://www.cloudflare.com/learning/ssl/lava-lamp-encryption/) explaining the how and why).

{{< figure src="/mc-villagers-rng/cloudflare-lava-lamps.jpg" alt="Lava lamp wall at Cloudflare" position="center" caption="Lava lamp wall at Cloudflare." style="border-radius: 10px" >}}

The reason the trick with lava lamps works is not because they provide some magic solution to randomness, but rather they're inherently **chaotic**. While it's not impossible to predict what the *state* of the blob in the lava lamp will be, it's incredibly difficult and practically impossible since you would have to know the exact state of every molecule/atom in the lamp, how it interacts with other molecules and so on. The same applies to waves in the ocean, air currents and many other phenomena.

One example which illustrates this very well is a double pendulum. Its trajectory is very sensitive to initial conditions and even the slightest change will result in a completely different trajectory. You could add even more joints and the result would be *even more* chaotic.

{{< figure src="/mc-villagers-rng/double-pendulum.gif" alt="Double pendulum GIF" position="center" caption="Trajectory of a double pendulum. (Courtesy of Wikipedia)" style="border-radius: 10px; margin: auto" >}}

So once you are able to capture the state of your pendulum or your lava lamp, you can analyze it and create a unique set of numbers representing the state of your chaotic contraption. This set of numbers could be absolutely anything: last 10 captured positions of the pendulum, or a parsed picture of the lava lamp - you can go crazy with it as long as it actually represents the state.

## Pseudo-randomness

Yeah, and computers aren't able to achieve neither random nor a chaotic result by themselves - they're *designed* to be completely predictable. But since we often do need numbers or strings *resembling* randomness, some people far more clever than I am came up with the idea of **pseudo-randomness**. Similar to a double pendulum, the initial conditions of a random number generator will result in a completely different set of generated numbers (as expected).

If you want to generate a random number in a low-level language like C, you need to initialize the generator with something called a *seed*, which in this case are the initial conditions.

```c
#include <time.h>
#include <stdlib.h>

srand(time(NULL));
int r = rand();
```

Here `time(NULL)` returns the amount of seconds passed since the Epoch (1st of January 1970, 00:00:00) and `srand()` initializes the RNG. So every time you run this code and `time(NULL)` returns a different value, each `rand()` call will return a pseudo-random value, hopefully unique to that run. Keep in mind, that if you were to initialize the RNG with a constant number, say 42, the results will be the same *every time* you run the app. The following code:

```c
#include <time.h>
#include <stdlib.h>

int main()
{
  int seed = 42;
  srand(seed);

  for(int i = 0; i < 10; i++) {
    int pseudoRandomNumber = rand();
    printf("%d\n", pseudoRandomNumber);
  }

  return 0;
}
```

gave this output (and every time *you* run it, you should have the exact same):

```
71876166
708592740
1483128881
907283241
442951012
537146758
1366999021
1854614940
647800535
53523743
```

Higher-level languages like Python, JavaScript or C# use the system- (time-based) or user-provided seed to initialize the RNG. However, nothing stops you, or programmers in general, to use a combination of other factors like:

- CPU temperature
- CPU uptime
- battery level or power supply voltage

just to name a few. And I am more than sure there are libraries and implementations doing exactly that.

## The Idea

So forget about everything useful we've said so far and imagine the *worst* way to seed an RNG. That's right - **Minecraft Villagers**.

As far as I'm aware, all mobs in Minecraft use the same RNG to figure out their movement patterns (they call it an AI on their [wiki](https://minecraft.fandom.com/)) and while not entirely pseudo-random in certain environments (this depends on the blocks they walk on, interactions with other villagers or weather phenomena), we can *make* them to be as pseudo-random as possible. That would entail removing all factors which may cause the villagers to stop wandering aimlessly (we want that), or prefer to stand on a certain block, or get startled, or anything similar.

So I devised a plan to put a villager in a 16x16 cage which they can't escape and simply let them walk around, meanwhile I would capture their position every couple seconds to generate the seed.

## Implementation

As I'm not very comfortable in Java and would gladly never touch Java code, I started to look around online for a Minecraft Server Docker image. To my surprise there were quite a lot to choose from and I settled on [itzg/minecraft-server](https://hub.docker.com/r/itzg/minecraft-server) with PaperMC as it's the lightest and I didn't need any fancy features and whatnot. MC servers (many other games implement this protocol) have this really cool functionality called RCON which is a TCP-based connection allowing you to run Minecraft commands as the server, so you don't need a Minecraft client to do so.

After setting up and configuring the server (setting peaceful mode to `true` and so on) I got to writing the juicy part.

I created a Node.js HTTP server with Express and connected to the MC server using [rcon-srcds](https://www.npmjs.com/package/rcon-srcds) library. Then I ran a couple commands to create the cage, spawn the villager in the middle and added an interval to look up the position of the villager every 7.5 seconds.

I left it running for some time adn when I came back I realized that I've made a grave mistake, because the moment I logged out of the server, the villager stopped moving and rightfully so. Minecraft Servers optimize so that mobs don't move when they are not being rendered and they are only rendered when there's a user nearby.

So I started looking around again and found a really cool project called *PrismarineJS* and their repo [mineflayer](https://github.com/PrismarineJS/mineflayer). Mineflayer is a JS library which allows you to spawn bots, and for my purposes I only needed the bots to stand near a villager, so the villager's "AI" activates. I knew that the villager can't be allowed to see the bot, since it would cause the villager to walk near it and that destroys the whole purpose of the project.

