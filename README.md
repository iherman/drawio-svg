# Process the SVG file exported from draw.io for VC WG related diagrams.

The script is used to process the various SVG diagrams used in the vocabulary specification defined by the [W3C Verifiable Credential Working Group](https://www.w3.org/2017/vc/WG/). The reason for this script is a bug in draw.io in conjunction with links assigned to transparent shapes. The bug has been reported in a [github issue](https://github.com/jgraph/drawio/issues/3806); if the bug is taken care of in a later release of [draw.io](https://www.drawio.com/), then this script may become unnecessary.

Note however, that this script also includes an [SVGO](https://www.npmjs.com/package/svgo) processing; if the script itself becomes moot, SVGO should still be used. The main reason is to convert the SVG file into a real rescaled graphics, by removing the explicit width and height values from the top level `<svg>` element. Just for the records, here is the configuration of SVGO as used for the VC diagrams:

```js
{
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeMetadata: false,
                    removeTitle: false,
                    removeDesc: false,
                    convertShapeToPath: false,
                    removeViewBox: false,
                }
            }
        },
        'removeDimensions'
    ],
    js2svg: {
        indent: 4,
        pretty: true
    }
}
```

This script, or SVGO, should be run on the diagram SVG files, as exported from [draw.io](https://www.drawio.com/), before incorporating them into the vocabulary definition files.
