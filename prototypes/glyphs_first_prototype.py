"""Very first prototype for making glyphs.

Currently supports : 
 - all symbols
 - variable base branch height based on simple/complex glyphs

Currently does not support :
 - variable complex branching height based on height of symbols (probably needs a new mapping from symbols to relative height displacement)
 - correct horizontal spacing 
 - custom "end" bits (sometimes the last glyph is at the tip, sometimes not)
 - custom base branch height
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import re

h = 10 # max height of one glyph
w = 40 # length
G = np.zeros((2*h+1,40))
# G[h,:] = 1

rainbow = plt.get_cmap("gist_rainbow")
cmap = ListedColormap([(0,0,0,1)] + [rainbow(x) for x in np.linspace(0,1,98)])


glossary = {
    "1":[(-1,0)],
    "2":[(-1,0),(-2,0)],
    "3":[(-1,0),(-2,0),(-3,0)],
    "4":[(-1,0),(-2,0),(-2,-1)],
    "5":[(-1,0),(-2,0),(-3,0),(-3,-1)],
    "6":[(-1,0),(-2,0),(-2,-1),(-2,-2)],
    "7":[(-1,0),(-2,0),(-3,0),(-3,-1),(-3,-2)],
    "8":[(-1,0),(-2,0),(-3,0),(-3,-1),(-3,-2),(-2,-2)],
    "9":[(-1,1),(-2,1),(-3,1)],
    "A":[(-1,0),(-2,0),(-2,1),(-2,2),(1,0),(2,0),(2,1),(2,2)],
    "B":[(-1,0),(-2,0),(-2,1),(-2,2),(-1,2),(1,0),(2,0),(2,1),(2,2),(1,2)],
    "C":[(-1,0),(-2,0),(-3,0),(-3,1),(-3,2),(1,0),(2,0),(2,1),(2,2)],
    "a":[(1,0)],
    "b":[(1,0),(2,0)],
    "c":[(1,1)],
    "^":[(-1,1),(-2,2),(-3,3)],
    "|":[(-1,0),(-2,0),(-3,0)],
    ".":[(0,1),(0,2),(0,3)],
    "'":[(0,1),(-2,1)],
}

def reading_to_glyph(sentence):
    pixels = []
    G = np.zeros((21,150))
    cursor = 0
    glyph_words = re.findall(r"\*?\([^\)]*\)", sentence)
    for debug, glyph in enumerate(glyph_words, start=1):
        split = False
        oldcursor = cursor
        if glyph[0] == "*":
            glyph = glyph[1:]
            split = True
        glyphs = glyph[1:-1].split("/")
        if len(glyphs) == 2:
            top, bottom = glyphs
        else:
            [top], bottom = glyphs, ""
        pixels, cursor = draw_glyph(top, cursor, "top", end=(debug==len(glyph_words)))
        for p in pixels:
            G[*p] = debug
        if len(bottom) > 0:
            cursor = oldcursor + 3*(1-split) # remove offset if there was no asterisk
            pixels, cursor = draw_glyph(bottom, cursor, "bottom", end=(debug==len(glyph_words)))
            for p in pixels:
                G[*p] = debug
            
    return G
        
def draw_glyph(g, cursor, side="top", end=False):
    flip = 1 if side == "top" else np.array([-1,1])
    pixels = []
    if len(g) == 0:
        return pixels, cursor
    branch = np.array([h+1,cursor])    
    current = np.array([h+1,cursor])
    if ("^" not in g) and ("|" not in g):
        pixels += [current + p*flip for p in [(-1,1),(-2,2),(-3,3),(-4,4)]]
        pixels += [branch + p*flip for p in [(0,1),(0,2),(0,3),(0,4)]]
        current += np.array([-4,4])*flip
        branch += np.array([0,4])*flip
    else:
        pixels += [current + p*flip for p in glossary["^"]]
        pixels += [branch + p*flip for p in glossary["."]]
        current += np.array([-3,3])*flip
        branch += np.array([0,3])*flip
    g = g[1:]
    branched = False
    for ch in g:        
        if ch == "^":
            pixels += [current + p*flip for p in glossary[ch]]
            current += np.array([0,3])*flip
        elif ch == "'":
            pixels += [current + p*flip for p in glossary[ch]]
        else:
            pixels += [current + p*flip for p in glossary["."]]
            current += np.array([0,3])*flip
            pixels += [current + p*flip for p in glossary["."]]
            current += np.array([0,3])*flip
            
            pixels += [current + p*flip for p in glossary[ch]]
        if not end:
            pixels += [branch + p*flip for p in glossary["."]]
            branch += np.array([0,3])*flip
            pixels += [branch + p*flip for p in glossary["."]]
            
        
        if branched:
            current -= np.array([-3,9])*flip
            branched = False
        if ch in ("^", "|"):
            branched = True
            current += np.array([-3,0])*flip
        branch += np.array([0,3])*flip
    if not end:
        pixels += [branch + p for p in glossary["."]]
    current += np.array([0,3])*flip
    return pixels, current[1]


def show_glossary():
    global glossary
    fig, (top,bottom) = plt.subplots(2,9)
    for ax in bottom[np.array([0,4,8])]: 
        ax: plt.Axes
        ax.set_visible(False)
    for (ax, ch) in zip(top, range(1,10)):
        g = glossary[str(ch)]
        ax: plt.Axes
        G = np.zeros((7,7))
        G[3,:] = 1
        for p in g:
            pos = np.array((3,3)) + np.array(p)
            G[*pos] = 2
        ax.set_axis_off()
        ax.set_title(str(ch))
        ax.imshow(G)
    for (ax, ch) in zip(bottom[np.array([1,2,3,5,6,7])], ["A","B","C","a","b","c"]):
        g = glossary[ch]
        ax: plt.Axes
        G = np.zeros((7,7))
        G[3,:] = 1
        for p in g:
            pos = np.array((3,3)) + np.array(p)
            G[*pos] = 2
        ax.set_axis_off()
        ax.set_title(ch)
        ax.imshow(G)
    plt.show()
    

fig, ax = plt.subplots()
ax : plt.Axes


glyph = reading_to_glyph("(.|11)-*(.'72/..8)-(..8)-*(..C/.39)-(.88/2|11)-(/.54)-*(..8/.54)-*(.^1a/.^1a)")

# show_glossary()


ax.imshow(glyph, cmap=cmap)
ax.set_axis_off()
plt.show()

