import { DOMParser, XMLSerializer } from 'xmldom';
import { promises as fs }           from 'node:fs';
import { Command }                  from 'commander';

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

// parseAndProcess('test.svg','nami.svg');

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

    await fs.writeFile(outp, new_svg_txt);
}

main();
