/**
 * ## Process the SVG file exported from draw.io for VC WG related diagrams.
 *
 * The reason for this script is a bug in draw.io in conjunction with links assigned to transparent
 * shapes. The bug has been reported in https://github.com/jgraph/drawio/issues/3806; if the bug
 * is taken care of in a later release of draw.io, then this script becomes unnecessary.
 *
 * Note however, that this script also includes an [SVGO]() processing; if the script itself
 * becomes moot, SVGO should still be used. The main reason is to convert the SVG file into
 * a real rescaled graphics, by removing the explicit width and height values from the
 * top level `<svg>` element.
 *
 * @param svg_text
 * @param verbose
 * @returns
 */

import { DOMParser, XMLSerializer } from 'xmldom';
import { promises as fs }           from 'node:fs';
import { Command }                  from 'commander';
import * as svgo                    from 'svgo';

/**
 * Process the SVG file exported from draw.io for VC WG related diagrams. The draw.io
 * error consists of, sometimes, omitting the `pointer-events="all"` attribute
 * from shapes when they are otherwise transparent. That creates a problem for VC
 * diagrams that assign a vocabulary URL to each shape referring to a term.
 *
 * The script localizes all `<a>` elements, takes the first element child (which is the enclosing shape)
 * and adds the missing attribute.
 *
 * A minor issue is also taken care of: time to time draw.io adds an extra message to the bottom of the diagram
 * which refers to a bug with text. That is also enclosed in an `<a>` element which is then removed from
 * the SVG file.
 *
 * The function relies on the `xmldom` package for pure XML processing (the more widespread `jsdom` package
 * cannot be used because it does not have an XML serializer). Note that I was cheating a bit with the types, referring
 * to, e.g., `HTMLAnchorElement`; the reason is that I did not find the proper type hierarchy in `xmldom`...
 *
 * @param svg_text
 * @param verbose
 * @returns
 */
function parseAndProcess(svg_text: string, verbose: boolean = false): string {
    const svg = new DOMParser().parseFromString(svg_text);
    const document = svg.documentElement;
    const links = document.getElementsByTagName('a');
    if (verbose) console.log(links.length);
    for (let i = 0; i < links.length; i++) {
        const link: HTMLAnchorElement|null = links.item(i);
        if (link === null) {
            if (verbose) console.log(`Something is wrong with link #${i}`);
        } else {
            const href = link.getAttribute('xlink:href');
            if (href !== null) {
                if (verbose) console.log(`processing ${href}`);
                if (href === "https://www.drawio.com/doc/faq/svg-export-text-problems") {
                    link.parentNode?.removeChild(link);
                } else {
                    const getFirstElement = (elem: HTMLAnchorElement): HTMLElement | null => {
                        for (let n = 0; n < elem.childNodes.length; n++) {
                            const shape = elem.childNodes.item(n);
                            if (shape.nodeType === shape.ELEMENT_NODE) {
                                return shape as HTMLElement;
                            }
                        }
                        return null;
                    };
                    const shape = getFirstElement(link);
                    if (shape === null) {
                        console.error(`Something is wrong with ${href}`);
                    } else {
                        if (verbose) console.log(`   Processing ${shape.nodeName}`);
                        if (verbose) console.log(`        Adding new attribute`);
                        shape.setAttribute("pointer-events", "all");
                    }
                }
            }
        }
    }
    return (new XMLSerializer()).serializeToString(svg)
}

/**
 * Main Entry point. Just call out to @link{parseAndProcess} and then run the resulting svg text
 * through SVGO. See the [SVGO entry on npm](https://www.npmjs.com/package/svgo) for further details.
 *
 * Note the SVGO options used. If SVGO is used standalone in case this script becomes obsolete, those
 * flags should be used...
 */
async function main() {
    const program = new Command();
    program
        .name('drawio-svg')
        .usage('[option] file')
        .description('Massaging svg exported from draw.io')
        .option('-o --output [output]', 'Output file name')
        .option('-v --verbose','Verbose mode: write traces')
        .parse(process.argv);

    if (program.args.length === 0) {
        console.error('No input SVG file');
        process.exit(-1);
    }

    const inp: string = program.args[0];

    const options = program.opts();
    const outp: string  = options.output ? options.output : inp;

    const svg_text = await fs.readFile(inp, 'utf-8');
    const new_svg_txt = parseAndProcess(svg_text, options.verbose);

    // Run svgo on this
    const result = (svgo.optimize(new_svg_txt, {
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
    })).data;
    await fs.writeFile(outp, result);
}

main();
