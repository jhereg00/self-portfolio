---
title: Road Trip Hacks
roles:
  - co-designer
  - developer
  - animator
date: 2016-08-09
sexiness: 5
masthead: interactive/road-trip-hacks/road-trip-hacks.jpg
siteUrl: http://www.experienceonstar.com/view/road-trip-hacks
excerpt: Immersive guide to easier road trips.
---

<p class="lead-in">An immersive guide to 8 tips to make road trips easier.</p>

This custom built article for OnStar took our animation effects to a new level. A combination of many techniques allowed us to fine tune the effects to a level of fluid precision that we'd never quite had before.

## Dynamic Keyframes

<aside class="pull-quote halftone right">
  <p>The dynamic keyframe approach has since become a staple</p>
</aside>

Most animation methods rely on keyframes, and ours is no different. A keyframe is an exact value (like position) at an exact point in the animation (which, in our case is scroll position rather than time). The new trick that I created allowed us to create these keyframes on the fly, programmatically. This allowed me to time the animations differently based on your window size, while still ensuring that each section's point of ideal readability was consistent.

Using CSS 3D transforms and a very precise vanishing point matched to the background image allowed us to create the effect of the content driving towards the user. Although we ultimately went with a fairly linear path, in original design and testing the sections were even able to follow a much more winding road.

The dynamic keyframe approach has since become a staple in CE's more complex web animations.

## Background Toy Box

We, uh, may have gone a little nuts while waiting on final content approval. The background is full of fun toys and visual techniques as the story progresses.

<figure class="two-on-one breakout-left breakout-right">
![Initial Background](/images/interactive/road-trip-hacks/day.jpg)
<div class="pull-quote halftone"><p>The background gradually changes through a day/night cycle.</p></div>
![Final Background](/images/interactive/road-trip-hacks/night.jpg)
</figure>

Initially, the user lands on a nice early afternoon scene. As they progress, the ground and sky receive hue-rotation, brightness, contrast, and desaturation effects. Eventually, both the sky and ground are replaced with alternate images for the full night scene. The night sky rotates rather than just sliding. And, the bit that won the most attention from people passing my desk during development was the semi-random northern lights effect. For performance reasons, this final toy was limited to Chrome on desktop machines, but if you're not using that you can check out my <a href="http://codepen.io/jhereg00/pen/JKbQyR" target="_blank">CodePen</a> with it isolated.
