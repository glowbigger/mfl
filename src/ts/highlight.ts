// in the html, a div for syntax highlighting is placed over a transparent 
// contenteditable div, this function creates the highlighted visible text
// the idea comes from https://stackoverflow.com/a/41885674

export default function highlight(source: string): string {
  // return `<span class='hl_red'>${source}</span>`;
  return source;
}
