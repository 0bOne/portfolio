# portfolio

I am frequently asked for a portfolio. With more than 45 years at the keyboard, putting one together is no small feat! Not to mention how NDAs complicate things.

But, finally, I have started one, going all the way back to the 1980s.

Many of these projects are screenshots, or replicas from memory, but hopefully even those will give you an idea of my journey through software engineering.


## Highlights 


## Catalog


### Comet Simulator (1984)

* **Title:** Comet Simulator
* **Date:** 1984
* **Language:** BBC (Micro) BASIC
* **Project:** For fun

As an armchair physicist and full-on computer programmer, it was natural (for me at least) to combine the two. This particular project was for fun, and it followed my learning of two important astronomy concepts: Newton's universal law of gravitation (the force of gravity is proportional to the product of the masses and inversely proportional to the distance between them) and the knowledge that a comet's tail always points away from the sun.

Up until then I thought that a comet, as the Bayeux tapestry depicts, had a tail that streams out behind it like a contrail. In fact it's more like a steam ship, where the smoke from the smokestack follows the wind. A comet's tail always follows the solar wind, which means it points away from the Sun, regardless of the comet's direction of travel.

The original required careful attention to performance. For example, I had to carefully erase only the comet and its tail—as a full screen redraw was far too slow. In this version I just wipe the canvas and start over!

I have re-created it here in JavaScript using jQuery and an HTML5 canvas—so as usual the code looks nothing like the original. I also recall a few more settings on the original, but can't remember exactly what they were. Nevertheless, this will give you an idea.

All Javascript (with JQuery) - no GPU.

* [Proceed to simulator](accretion/accretion.html)


### 3D Maze (1986)

* **Title:** 3D Maze
* **Date:** 1986
* **Language:** Atari BASIC, 6502 Machine Code
* **Project:** For fun

In my quest to conquer the world of the 3D, inspired by Bell and Braben's [Elite™](http://en.wikipedia.org/wiki/Elite_%28video_game%29), I created several 3D "worlds", including this maze. Too rudimentary to be called games, they focused on 3D rendering.

I'd recently created a wireframe "mountain" scape similar to [*Battlezone™*](http://en.wikipedia.org/wiki/Battlezone_%281980_video_game%29) and observed that it didn't take a lot of detail to bring smoothness of scrolling to a halt.

I wanted to push the limits, so I created this 3D "maze"—the maze was auto-generated and there were no enemies.

Bit-blitting and tweening were terminology that I wouldn't hear until decades later. Nevertheless, this simulation used machine code to "blit" wall shapes from offscreen RAM onscreen to create the effect of smooth movement between fixed nodes in the maze.

To give you an idea of what this was like, I have included an image of the Sinclair ZX81's *Monster Maze*, almost certainly a subconscious inspiration. My graphics and animation were considerably smoother, but then again I had better hardware by a generation. *Monster Maze* was limited to special characters that extended the ASCII set, whereas I had access to pixels and more than twice the display resolution.

Eventually, I hope to find the time to re-create this in HTML5 where it will almost certainly run smoothly without resorting to anything like machine language—and probably 0.1% of the code size!

![Monster Maze](3dmaze/monstermaze.jpg)






