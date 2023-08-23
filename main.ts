import { DOMParser, XMLSerializer } from 'xmldom';
import { promises as fs } from 'node:fs';

async function parseAndProcess(f: string, t: string) {
    const svg_text = await fs.readFile(f,'utf-8');
    const svg = new DOMParser().parseFromString(svg_text);
    const document = svg.documentElement;
    const links = document.getElementsByTagName('a');
    console.log(links.length);
    for (let i = 0; i < links.length; i++) {
        const link: HTMLAnchorElement|null = links.item(i);
        if (link === null) {
            console.log(`Something is wrong with link #${i}`);
        } else {
            const href = link.getAttribute('xlink:href');
            if (href !== null) {
                console.log(`processing ${href}`);
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
                        console.log(`Something is wrong with ${href}`);
                    } else {
                        console.log(`   Processing ${shape.nodeName}`);
                        console.log(`        Adding new attribute`);
                        shape.setAttribute("pointer-events", "all");
                    }

                }
            }
        }
    }
    console.log("Writing...");
    await fs.writeFile(t,(new XMLSerializer()).serializeToString(svg))
}

parseAndProcess('test.svg','nami.svg');
