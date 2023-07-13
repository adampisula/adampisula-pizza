---
title: "Stateless WebSockets 101"
date: 2023-07-12T17:05:00+02:00
draft: true 
---

## Intro

There are multiple ways to achieve realtime communication between a client and a server, some of them being [HTTP polling](#), [server-sent events](#), and [WebSockets](#) and the like, such as [Socket.io](#). Apart from polling, all of the aforementioned solutions require your app to have a persistent a connection between the server and the client. In this article we'll focus on WebSockets, but the idea extrapolates to any other method.

## The problem


Imagine you're writing a brand new chat app that you hope is going to take over the world. You got most of the functionality down; you've successfully implemented the realtime connection between the server and the client to receive messages. For that purpose you used WebSockets (or something similar) and created two endpoints: `/events` for establishing a connection, and `/send` where you **POST** a message to send to a specific user. You containerized the app, tested it and everything seems to work fine - Anne can now message Bob, and Bob receives the message after a few milliseconds. Now you're ready to deploy it to production, you think.

So you do. Your app works well and you see hundreds, maybe even thousands of users. This goes on for a while, but suddenly you start getting complaints from the users that the app is getting unbearably slow. You investigate and see that the solution is pretty simple - you gotta *scale it up*, because your single instance simply can't keep up with the traffic. After doing some reading, you realize you there's two ways to scale your app: **vertically** and **horizontally**. The former means you simply get a more beafy server, but this is not ideal for at least two reasons - 1. there is a limit to how much processing power your server can have, and; 2. say your target audience is a bit more localized, and most of your users come from the Netherlands. This means that the majority of traffic will happen during the day, and your huge server will stay more or less idle during the night.

The latter is the more widely adopted technique nowadays. Scaling horizontally is in its essence deploying multiple instances of your app and most often using a load balancer to distribute traffic among the instances - it can be done dynamically, so the more traffic you get, the more instances of your app are being created. This requires your app to be stateless (not storing data in the app's working memory), as instances are meant to be ephemeral, meaning the orchestrator (such as Kubernetes) can discard and spawn new instances of the app without any loss of data. But a keen eye might notice a persistent connection such as a WebSocket inherently introduces state into your app.

{{< figure src="/stateless-websockets-101/multiple-instances-load-balancer.png" alt="Diagram of multiple instances of your app behind a load balancer" position="center" caption="Typical setup of multiple instances of an app behind a load balancer." style="border-radius: 10px; margin: auto" >}}

Since each instance stores the WebSocket handlers for its connections, there is no way for **Instance #1** to send a message to a client on **Instance #2**.

Let's take a look at an example:

- _Anne_ opens your chat app and a WebSocket connection is established on **Instance #1**
- _Bob_ opens the chat ass well, and load balancer points him to **Instance #2**, where he establishes a connection
- _Anne_ sends a POST request to `/send` with the following body:

```json
{
    "to": "Bob",
    "message": "deez"
}
```
- Load balancer sees there's less traffic on **Instance #1**, so her request goes there
- **Instance #1** does NOT have a handler for _Bob_'s WebSocket, so it responds with a `404 Not Found`

{{< figure src="/stateless-websockets-101/wojak-screen.png" alt="Wojak crying in front of a screen." position="center" caption="You, after realizing you'll have to rewrite your app to be stateless." style="border-radius: 10px; margin: auto" >}}

## The solution

Very few apps can be _truly_ stateless, but people still manage to scale horizontally - how? The answer lies in _shifting responsibility_. If you used a database before, congrats! You shifted the responsibility of preserving data from your app to the database. But what's the equivalent to a database for the problem you're having? A message queue.

There is a plethora of different MQs, such as [RabbitMQ](#), [Apache ActiveMQ](#), [ZeroMQ](#), and many, many more. Thankfully, there is a standard in place for communication with a message queue called AMQP, so it's very likely that what we'll code in this article will work even if you use a different MQ than I do here, which is **RabbitMQ**.

For our purposes we'll use a 
