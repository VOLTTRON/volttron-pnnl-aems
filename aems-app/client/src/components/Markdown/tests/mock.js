const text = `
---
# __Markdown Guide__

### __Click 'View Markdown' at the bottom of this page to view the raw markdown used.__

---

## Anchor tags to headers

[Horizontal Rules](#horizontal-rules)

[Typographic replacements](#typographic-replacements)

[Emphasis](#emphasis)

This is an anchor tag within text to the [links](#links) section.

---

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading


## Horizontal Rules

___

---

***


## Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'


## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~


## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.


## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar


## Code

Inline \`code\`

Indented code

\`\`\` command
    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code
\`\`\`

Block code "fences"

\`\`\` command
Sample text here...
\`\`\`

Syntax highlighting

\`\`\` js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
\`\`\`

## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


## Links

> A file from the internet.
[link text](http://dev.nodeca.com)

> A file store on the server.
[Download File](/products/BSET_bilevel_illu.svg)

## Images
> An image from the internet.
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

> An image stored on the server.
![Architecture](/products/BSET_bilevel_illu.svg)


### Subscript / Superscript

- 19^th^ 20^th^
- Hˇ2ˇO Hˇ2ˇOˇ2ˇ
- Hˇ2ˇO 1^st^
- ˇaˇB^c^
- Test^this


### Hints

!> Here is a tip.

?> And a warning.

x> Or an error.
`;

export default text;
