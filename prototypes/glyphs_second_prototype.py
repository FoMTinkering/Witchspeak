"""Second prototype for making glyphs.

Structured into classes to properly separate each step.

Currently supports :
 - all symbols
 - variable base branch height based on simple/complex glyphs
 - variable complex branching height based on height of symbols
 - custom "end" bits
 - custom base branch height

Currently does not support :
 - correct horizontal spacing
 - complex glyphs with multiple characters post-branch split
 - apostrophe character can't be on a ^
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import re

rainbow = plt.get_cmap("gist_rainbow")
cmap = ListedColormap([(0, 0, 0, 1)] + [rainbow(x) for x in np.linspace(0, 1, 98)])


def spacing(vx: int, vy: int) -> callable:
    """Generates a function that returns a list of pixels along a given vector.

    Args:
        vx (int): first coordinate of vector.
        vy (int): second coordinate of vector.

    Returns:
        (callable): Function that takes a number of entries `n` as a parameter,
        and returns a list of `n` positions taking `n` steps along the vector.

    Example:
        >>> vertical = spacing(0,1)
        >>> vertical(5)
         [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5)]
    """

    def func(n):
        return [(vx * step, vy * step) for step in range(1, n)]
    return func


glossary = {
    "characters": {
        "1": [(-1, 0)],
        "2": [(-1, 0), (-2, 0)],
        "3": [(-1, 0), (-2, 0), (-3, 0)],
        "4": [(-1, 0), (-2, 0), (-2, -1)],
        "5": [(-1, 0), (-2, 0), (-3, 0), (-3, -1)],
        "6": [(-1, 0), (-2, 0), (-2, -1), (-2, -2)],
        "7": [(-1, 0), (-2, 0), (-3, 0), (-3, -1), (-3, -2)],
        "8": [(-1, 0), (-2, 0), (-3, 0), (-3, -1), (-3, -2), (-2, -2)],
        "9": [(-1, 1), (-2, 1), (-3, 1)],
        "A": [(-1, 0), (-2, 0), (-2, 1), (-2, 2), (1, 0), (2, 0), (2, 1), (2, 2)],
        "B": [(-1, 0), (-2, 0), (-2, 1), (-2, 2), (-1, 2), (1, 0), (2, 0), (2, 1), (2, 2), (1, 2)],
        "C": [(-1, 0), (-2, 0), (-3, 0), (-3, 1), (-3, 2), (1, 0), (2, 0), (2, 1), (2, 2)],
        "a": [(1, 0)],
        "b": [(1, 0), (2, 0)],
        "c": [(1, 1)],
        "'": [(-2, -1)],
    },
    "spacings": {"^": spacing(-1, 1), "|": spacing(-1, 0), ".": spacing(0, 1)},
}

# set default "." spacing
default_spacing = 3
glossary["characters"]["."] = glossary["spacings"]["."](default_spacing)


class Reading:
    """Visual representation of a Witchspeak sentence given its transcription."""

    def __init__(
        self, sentence: str, max_glyph_height: int = 10, start: int = 0, end: int = 0
    ):
        r"""Create a visual representation of a Witchspeak sentence given its
        transcription.

        Args:
            sentence (str): Witchspeak sentence. Must be decomposible using
                the regex pattern `\*?\([^\)]*\)` into valid glyph words.
            max_glyph_height (int): maximum height enforced on a glyph.
                This means each sentence will be no higher than `2*max_glyph_height+1`.
            start (int): At what position along the main horizontal line the sentence starts.
            end (int): How many pixels to remove from the final glyph's horizontal line.
        """
        self.sentence = sentence
        self.h = max_glyph_height
        self.start, self.end = start, end
        self.glyph_pairings_list = self.make_glyph_list()
        self.reading_to_glyph()

    @property
    def glyph_list(self) -> list["Glyph"]:
        """List of all glyphs in the sentence."""
        glyph_list = []
        for top, bottom, _ in self.glyph_pairings_list:
            if len(top) > 0:
                glyph_list.append(top)
            if len(bottom) > 0:
                glyph_list.append(bottom)
        return glyph_list

    @property
    def glyph_pairings_lengths(self) -> list[int]:
        """List of lengths of glyph pairings. A glyph pairing is any pair of glyphs
        grouped in parentheses in the transcribed Witchspeak sentence."""
        return [
            max(
                len(top_glyph),
                len(bottom_glyph) + default_spacing * (not split and (len(top_glyph) * len(bottom_glyph) != 0)),
            )
            for (top_glyph, bottom_glyph, split) in self.glyph_pairings_list
        ]

    def __len__(self) -> int:
        return sum(self.glyph_pairings_lengths)

    def make_glyph_list(self) -> list[tuple["Glyph", "Glyph", bool]]:
        """Generate a list of tuples containing glyph pairings and positional information.

        Returns:
            (list): List of tuples containing the top glyph, bottom glyph
                and corresponding split variable for every pairing of glyphs.
        """
        glyph_pairings_list : list["Glyph", "Glyph", bool] = []
        glyph_words : list[str] = re.findall(r"\*?\([^\)]*\)", self.sentence)
        for glyph_word in glyph_words:
            split = glyph_word[0] == "*"
            if split:
                glyph_word = glyph_word[1:]
            current_words = glyph_word[1:-1].split("/")
            if len(current_words) == 2:
                top_word, bottom_word = current_words
            else:
                [top_word], bottom_word = current_words, ""
            top_glyph = Glyph(top_word)
            bottom_glyph = Glyph(bottom_word, flip=True)

            # populate the glyph list for development testing
            glyph_pairings_list.append((top_glyph, bottom_glyph, split))
        return glyph_pairings_list

    def reading_to_glyph(self) -> None:
        """Creates and fills the `Reading.grid` attribute with the visual representation of the sentence."""
        cursor = self.start
        self.grid = np.zeros((2 * self.h + 1, len(self)))
        if cursor != 0:
            self.grid[self.h, :cursor] = 1
        for pairing_number, (top_glyph, bottom_glyph, split) in enumerate(
            self.glyph_pairings_list, start=1
        ):
            oldcursor = cursor
            for e, pixel in enumerate(
                [p + np.array((self.h, cursor)) for p in top_glyph.pixels], start=1
            ):
                self.grid[*pixel] = pairing_number
            top_branch_length = len(top_glyph)

            if not split and (len(top_glyph) * len(bottom_glyph) != 0):
                cursor += default_spacing

            for e, pixel in enumerate(
                [p + np.array((self.h, cursor)) for p in bottom_glyph.pixels], start=1
            ):
                self.grid[*pixel] = pairing_number
            bottom_branch_length = len(bottom_glyph)

            cursor = max(oldcursor + top_branch_length, cursor + bottom_branch_length)

            end = (
                abs(self.end) if pairing_number == len(self.glyph_pairings_list) else 0
            )
            self.grid[self.h, oldcursor : cursor - end] = pairing_number


class Glyph:
    """Representation of a single glyph from the Witchspeak language."""

    def __init__(self, word: str, flip: bool = False):
        """Create a single glyph from the Witchspeak language.

        Args:
            word (str): Glyph word. Needs to be a valid word according to the rules (TODO: link a wiki or something)
            flip (bool): Whether the glyph is flipped upside down.
        """
        self.word = word
        self.flip = 1 if not flip else np.array([-1, 1])
        self.glyph_type()
        self.length = 0
        self.compute_pixels()
        self.pixels = [p * self.flip for p in self.pixels]

    def glyph_type(self):
        """Computes whether the glyph is a SimpleGlyph or a ComplexGlyph, and changes its class accordingly."""
        for ch in ("^", "|"):
            if ch in self.word:
                self.__class__ = ComplexGlyph
                self.vert_char = ch
                return
        self.vert_char = None
        self.__class__ = SimpleGlyph

    def __len__(self):
        return self.length

    def show(self, ax: plt.Axes = None, **kwargs):
        """Development tools - displays the glyph."""
        glyph_grid = np.zeros((10, len(self)))
        if ax is None:
            fig, ax = plt.subplots()
        for e, p in enumerate(self.pixels, start=1):
            glyph_grid[*p] = e
        ax.imshow(glyph_grid, **kwargs)
        ax.set_axis_off()

    def compute_pixels(self):
        """Computes the pixel offsets that generate a valid glyph representation,
        given the glyph word. These are stored in the `Glyph.pixels` attribute."""
        ...


class SimpleGlyph(Glyph):
    def compute_pixels(self):
        self.pixels = []
        word = self.word
        if len(self.word) == 0:
            return self.pixels

        # create an apostrophe character before branching off the horizontal branch
        if word[0] == "'":
            self.pixels = [(-6, 0)]
            word = word[1:]

        # check if the first character gives specific instructions on how to
        # start the glyph ; currently this only implements a different height
        # offset but could be used as metadata for other rules
        match word[0]:
            case ".":
                branch_spacing = 4
            case "0":
                branch_spacing = 4
            case "1":
                branch_spacing = 5
            case _:
                raise Exception(word)

        # starts the branch according to the spacing determined by the first character
        self.pixels += [p for p in glossary["spacings"]["^"](branch_spacing + 1)]
        position = np.array([-branch_spacing, branch_spacing])

        instant = False  # modifier to ignore horizontal spacing
        for ch in word[1:]:
            # instant character check
            if ch == "i":
                instant = True
                continue
            if instant:
                instant = False
            else:
                self.pixels += [
                    position + p for p in glossary["spacings"]["."](default_spacing + 1)
                ]
                position += np.array([0, default_spacing])

            # character draw
            self.pixels += [position + p for p in glossary["characters"][ch]]
        self.length = max(self.pixels, key=lambda k: k[1])[1] + 1


class ComplexGlyph(Glyph):
    def compute_pixels(self):
        self.pixels = []
        word = self.word
        if len(self.word) == 0:
            return self.pixels
        if word[0] == "'":
            self.pixels = [(-6, 0)]
            word = word[1:]
        vert_char_idx = word.index(self.vert_char)
        secondary_branch = word[vert_char_idx+1:]
        top_branch, bottom_branch = self.post_branching(secondary_branch)
        high_top_branch = set(top_branch).intersection({"2", "4", "6"}) != set()
        low_bottom_branch = set(bottom_branch).intersection({"b"}) != set()
        if high_top_branch and low_bottom_branch:
            raise Exception("branch error")
        elif high_top_branch:
            branch_spacings = (3, 2)
        elif low_bottom_branch:
            branch_spacings = (4, 2)
        else:
            branch_spacings = (3, 3)
        self.pixels += [p for p in glossary["spacings"]["^"](branch_spacings[0] + 1)]
        position = np.array([-branch_spacings[0], branch_spacings[0]])
        instant = False  # modifier to ignore horizontal spacing

        branched = False
        for ch in word[1:vert_char_idx]:
            # instant character check
            if ch == "i":
                instant = True
                continue
            if instant:
                instant = False
            else:
                self.pixels += [
                    position + p for p in glossary["spacings"]["."](default_spacing + 1)
                ]
                position += np.array([0, default_spacing])

            # character draw
            self.pixels += [position + p for p in glossary["characters"][ch]]
        if not instant:
            self.pixels += [
                position + p for p in glossary["spacings"]["."](default_spacing + 1)
            ]
            position += np.array([0,default_spacing])
            
        pre_branch_position = np.array([*position])
        # vertical branch
        self.pixels += [
            position + p
            for p in glossary["spacings"][self.vert_char](
                branch_spacings[1] + 1
            )
        ]
        # type of position offset depends on what the branching character was
        branch_offset = glossary["spacings"][self.vert_char](
            branch_spacings[1] + 1
        )[-1]
        position += branch_offset
        self.pixels += [
            position + p for p in glossary["spacings"]["."](default_spacing + 1)
        ]
        position += np.array([0,default_spacing])

        instant = False
        for ch in top_branch:
            if ch == "i":
                instant = True
                continue
            if instant:
                instant = False
            else:
                self.pixels += [
                    position + p for p in glossary["spacings"]["."](default_spacing + 1)
                ]
                position += np.array([0, default_spacing])

            # character draw
            self.pixels += [position + p for p in glossary["characters"][ch]]

        position = pre_branch_position
        instant = False
        for ch in bottom_branch:
            if ch == "i":
                instant = True
                continue
            if instant:
                instant = False
            else:
                self.pixels += [
                    position + p for p in glossary["spacings"]["."](default_spacing + 1)
                ]
                position += np.array([0, default_spacing])

            # character draw
            self.pixels += [position + p for p in glossary["characters"][ch]]

        self.length = max(self.pixels, key=lambda k: k[1])[1] + 1

    def post_branching(self, chars):
        brackets = {"[", "]"}
        if set(chars).intersection(brackets) not in [set(), brackets]:
            raise Exception("invalid branching : invalid brackets")
        if set(chars).intersection(brackets) == set():
            if len(chars) != 2:
                raise Exception("invalid branching : missing brackets")
            else:
                return list(chars)
        else:
            before = chars[:chars.index("[")]
            inside = chars[chars.index("[")+1:chars.index("]")]
            after = chars[chars.index("]")+1:]
            if ((len(before) == 0) + (len(inside) == 0) + (len(after) == 0)) > 1:
                raise Exception("invalid branching : needs more characters")
            if len(before) == 0:
                if after[0] == "[":
                    return inside, after[1:-1]
                else:
                    return inside, after
            else:
                return before, inside

if __name__ == "__main__":
    from glyphdata import known_sentences

    def show_sentence(sentence, **kwargs):
        reading = Reading(sentence=sentence, max_glyph_height=10, **kwargs)

        fig, ax = plt.subplots()
        ax: plt.Axes
        ax.imshow(reading.grid, cmap=cmap)
        ax.set_axis_off()
        plt.show()

    def show_sentence_glyphs(sentence, **kwargs):
        reading = Reading(sentence=sentence, max_glyph_height=10, **kwargs)
        fig, AX = plt.subplots(1, len(reading.glyph_list))
        for glyph, ax in zip(reading.glyph_list, AX):
            glyph.show(ax, cmap=cmap)
        plt.show()

    # example sentence
    sentence, end = known_sentences["Seridia Room"]
    show_sentence(sentence, end=end)

    # vertical spacing varies depending on characters in complex glyphs
    show_sentence("(.i^1b)-(.i^2a)-(.i^4a)-(.i^6a)")

    # although no example exists in game, complex glyphs can have multiple characters post-branching
    show_sentence("(.8^[.61][ac]/.54|3[bc])")

