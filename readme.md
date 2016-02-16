# Super Campaign Dodger
_Super Campaign Dodger_ is an arcade-style HTML5 game pitting the player against a deluge of political advertising.

It's based on data from the [Political TV Ad Archive](http://politicaladarchive.org/), an Internet Archive project.

## Random technical things about this

* The blocks are actual DOM `div` elements. Performance would probably be better with SVGs (and DEFINITELY better with canvas) but by only drawing blocks with they're about to appear in the viewport, there's basically no lag.
* Each block is positioned chronologically at the time the ad originally aired. Its height is determined by the ad's duration.
* The game speeds up exponentially, at a rate of 0.5 percent per second.

