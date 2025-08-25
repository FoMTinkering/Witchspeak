# Witchspeak

Use our Witchspeak creator tool to write your own Witchspeak sentences.
Customize your glyphs, render the sentences with different display modes and save them!

## Overview

Witchspeak is one of the fictional languages of Fields of Mistria. It is distinguishable by its sentences composed of a horizontal line, on which *glyphs* branch out on the top and bottom half.

We've identified Witchspeak sentences to be generally written under the following rules : 
- An initial, optional space before the first glyph
- A sequence of glyphs growing on the horizontal line
- An optional horizontal line cutoff

The initial space and optional cutoff are marked in our transcription by `x-...-y` where `x` is the number of pixels in the initial space, `...` is the list of glyphs, and `y` is the number of pixels removed from the  sentence had the cutoff been absent.

### Glyphs, Simple Glyphs

A *glyph*, for our purposes, written in parentheses `(...)`, is any of the branches growing off of the horizontal branch ; if another one can be spotted branching off on the bottom side before the top branch terminates, we group the two together as one glyph (so far this has only happened top/bottom, not bottom/top).
These are written as `(.../...)`. Sometimes, the bottom branch starts on the same pixel as the top branch. We write those as `*(.../...)`.

Glyphs are composed of what we call characters. Here's a comprehensive list of characters : 

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/characters.png)

A glyph can contain multiple characters, but the first character is very often spaced away from the branch ; when this is not the case we add an `i` character before the character, like below : 

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/i_showcase.png)

To add space between characters, we can insert a `.` anywhere. You may notice that the first character in the previous example is also a `.` despite it not inserting a space. This is because the first character of each glyph (bottom half included) must be one of `.` or `1`, which indicate different branch lengths :

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/ruins_seal_stairs.png)


### Complex Glyphs

Some glyphs have a multiple branches, with characters before the branch split, and on both of the split branches. We call those complex glyphs, and they can be present on both the top and bottom glyph of a pair, such as this one :

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/complex_example.png)

Complex glyphs come in two types, according to the vertical branching character, being `^`, representing a diagonal branching pattern, or `|`, being a vertical branching.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/complex_doubles.png)

Complex glyphs are written as `(...^[X][Y])`, with `...` being all characters before the branching point, `X` being all characters in the TOP branch and `Y` being all characters in the BOTTOM branch. 
Note that in the bottom glyph of a pair, "TOP" and "BOTTOM" will be flipped due to the whole glyph being upside down.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/complex_multiple.png)

If `X` or `Y` is a single character, the `[]` brackets can be removed (many examples of that are shown in this page).
Since the first `[X]` contains redundant information, writing `(...^X[Y])` is also valid, even if `X` contains multiple characters.

There is a final rule with complex glyphs : to conserve height, when the post-split branches have some specific characters, the position of the branch can move, to accomodate said characters.
For example, the prevent a `b` on the bottom branch from touching the horizontal line, the branch is moved upward by one pixel.
Similarly, to prevent a `2` on the top branch from touching the top (or bottom) of the image, the branch is moved downward by one pixel.
If a character of a height of 2 pixels is present on the top branch *and* a `b` is present on the bottom branch, the sentence won't render, because it would be invalid.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/height_variation.png)


[//]: # (Similarly, characters of a height of 3 aren't allowed -- needs to be implemented)


## Display options

The website allows users to display their Witchspeak sentences in different ways according to preference.
The method that was used to render all the examples in the previous section is the default "colored-per-character" mode, which is labeled Default on the website. Each character's color can be changed using the buttons in the bottom half of the page : 

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/colorselect.png)

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/colorselect_display.png)

The default colors for each of these was shown at the beginning of this page.

### Custom fixed color

If you want to see how the glyph looks as a unified color, you don't have to change each of the characters' colors one by one. We have a display mode called Custom that achieves exactly that :

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/earth_seal_custom_color.png)

### Per-pixel color

You can also color glyphs individually according to a gradient colormap, out of a list of suggested colormaps. The pixels are drawn in the order the parser processes them, so this could help you understand in what order the glyphs are drawn, according to our method.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/restore_pixel_color.png)

### Per-glyph color

Another way of coloring the glyphs is to color every pixel belonging to a glyph in a fixed color, but change each glyph's color gradually along the sentence, following the same colormaps.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/seridia_glyph_color.png)

### Shading and background color

Many of the visible Witchspeak sentences in the games are etched into stone, so there are "shadow" pixels above every drawn pixel of the glyph, to give an illusion of depth. We've included an option to add those in, with a slider to increse the intensity of the effect. This effect blends with the chosen background color seamlessly, so you can activate shading without having to worry about the background color.

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/seridia_shading_control.png)


### Custom canvas filters

WIP, adding some cool effects for you to display your glyphs with some amazing visuals!

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/filter_wip.png)

![](https://github.com/FoMTinkering/Witchspeak/blob/main/readme_files/filter_wip2.png)


## Input methods

To create a sentence, type a valid sentence in the textbox, or set the Color/Input switch to Input, and click on the buttons to add glyphs and characters!

- Clikcing on the `+` creates a new glyph
- If you've created a complex glyph by clicking on `^` or `|` :
  - type in the characters for the TOP branch
  - click on the `→` button to move to the bottom branch, and add characters there
- Clikcing on the `↓` adds a glyph on the bottom of the horizontal line
  - clicking on the button again after creating a bottom glyph will toggle the `*` feature
- Clicking on `«` will undo the last placed character
- Clicking on the button below will undo the last **glyph**
- Clicking on the button below will refresh the sentence


