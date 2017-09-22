import {
    Directive, ElementRef, Input, OnInit,
} from '@angular/core';
import * as D3 from 'd3';

declare let d3: any;

@Directive({selector: 'div[AgWordCloud]', exportAs: 'ag-word-cloud'})
export class AgWordCloudDirective implements OnInit {

    @Input() wordData: AgWordCloudData[];
    @Input() color: string[] = ['#2BAAE2', '#FF6B8D', '#cecece', '#003E5D', '#22BAA0', '#cecece'];

    @Input() options: AgWordCloudOptions = {
        settings: {
            minFontSize: 10,
            maxFontSize: 100,
        },
        margin: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        }
    };
    @Input() width: number;
    @Input() height: number;
    private old_min: number;
    private old_max: number;
    private svg: any;

    private element: ElementRef;

    public constructor(element: ElementRef) {
        this.element = element;
    }

    ngOnInit() {
        this.setup();
        this.buildSVG();
        this.populate();
    }

    private roundNumber() {
        const temp = this.wordData.map(d => {
            if (d.color) {
                return {text: d.text, size: this.scale(d.size), color: d.color};
            }
            return {text: d.text, size: this.scale(d.size), color: this.color[Math.floor(Math.random() * this.color.length)]};

        });
        this.wordData.length = 0;
        this.wordData.push(...temp);
    }

    private scale(inputY: number): number {
        const x = inputY - this.old_min;
        const y = this.old_max - this.old_min;
        const percent = x / y;
        return percent * (50 - 10) + 10;
    }

    private updateMaxMinValues() {
        this.old_min = Number.MAX_VALUE;
        this.old_max = Number.MIN_VALUE;
        this.wordData.map(res => {
            if (res.size < this.old_min) {
                this.old_min = res.size;
            }
            if (res.size > this.old_max) {
                this.old_max = res.size;
            }
        });
    }

    private setup() {
        if (!this.width) {
            this.width = this.element.nativeElement.parentElement.offsetWidth - this.options.margin.right - this.options.margin.left;
        }
        if (!this.height) {
            this.height = this.width * 0.75 - this.options.margin.top - this.options.margin.bottom;
        }


    }

    private buildSVG() {

        this.svg = D3.select(this.element.nativeElement)
            .append('svg')
            .attr('width', this.width + this.options.margin.left + this.options.margin.right)
            .attr('height', this.height + this.options.margin.top + this.options.margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + ~~(this.width / 2) + ',' + ~~(this.height / 2) + ')');
    }

    private populate() {
        if (this.svg) {
            this.svg.selectAll('*').remove();
        }
        this.updateMaxMinValues();
        this.roundNumber();
        const fontFace: string = (this.options.settings.fontFace == null) ? 'Roboto' : this.options.settings.fontFace;
        const fontWeight: string = (this.options.settings.fontWeight == null) ? 'normal' : this.options.settings.fontWeight;
        const spiralType: string = (this.options.settings.spiral == null) ? 'archimedean' : this.options.settings.spiral;
        console.log(this.wordData);
        d3.layout.cloud()
            .size([this.width, this.height])
            .words(this.wordData)
            .padding(5)
            .rotate(() => (~~(Math.random() * 2) * 90))
            .font(fontFace)
            .fontWeight(fontWeight)
            .fontSize(d => (d.size))
            .spiral(spiralType)
            .on('end', () => {
                this.drawWordCloud(this.wordData);
            })
            .start();

    }

    private drawWordCloud(words) {
        const tooltip = D3.select(this.element.nativeElement)
            .append('div')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .text('a simple tooltip');

        this.svg
            .selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .style('font-size', d => d.size + 'px')
            .style('fill', (d, i) => {
                return d.color;
            })
            .attr('mdTooltip', 'ddd')
            .attr('text-anchor', 'middle')
            .attr('transform', d => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
            .attr('class', 'word-cloud')
            .on('mouseover', function (d, i) {
                return tooltip.style('visibility', 'visible').text('Count: ' + d.size);
            })
            .on('mouseout', function () {
                return tooltip.style('visibility', 'hidden');
            })
            .text(d => {
                return d.text;
            });
    }

    public update() {
        this.populate();
    }


}


export interface AgWordCloudOptions {
    settings?: {
        minFontSize?: number,
        maxFontSize?: number,
        fontFace?: string,
        fontWeight?: string,
        spiral?: string,
    };
    margin?: {
        top: number,
        right: number,
        bottom: number,
        left: number
    };
}

export interface AgWordCloudData {
    text: string;
    size: number;
    color?: string;
}
