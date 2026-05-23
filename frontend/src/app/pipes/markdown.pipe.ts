import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    const html = this.markdownToHtml(value || '');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private markdownToHtml(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    html = html.replace(/^\s*[-*+] (.*)$/gm, '<li class="markdown-ul">$1</li>');
    html = html.replace(/^\s*\d+\. (.*)$/gm, '<li class="markdown-ol">$1</li>');
    html = html.replace(/(?:<li class="markdown-ul">.*?<\/li>\s*)+/gs, block => `<ul>${block}</ul>`);
    html = html.replace(/(?:<li class="markdown-ol">.*?<\/li>\s*)+/gs, block => `<ol>${block}</ol>`);
    html = html.replace(/<li class="markdown-(?:ul|ol)">/g, '<li>');

    html = html.split(/\n{2,}/).map(paragraph => {
      if (paragraph.match(/^<h[1-6]>|^<ul>|^<ol>|^<pre>|^<blockquote>/)) {
        return paragraph;
      }
      return `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
  }
}
