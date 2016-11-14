import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Renderer, HostListener } from '@angular/core';

@Component({
  selector: 'isari-col',
  templateUrl: './isari-col.component.html',
  styleUrls: ['./isari-col.component.css']
})
export class IsariColComponent implements OnInit, AfterViewInit {
  dragActive = false;
  orgX: number;
  orgWidth: number;

  @ViewChild('resizeHandle') handle: ElementRef;
  @ViewChild('column') column: ElementRef;

  @HostListener('document:mouseup', ['$event'])
  onMouseup(event) {
    if (this.dragActive) {
      this.dragActive = false;
      this.renderer.setElementClass(this.handle.nativeElement, 'active', false);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    if (this.dragActive) {
      let newX = event.clientX;
      this.column.nativeElement.parentElement.style.width = (newX - this.orgX + this.orgWidth) + 'px';
      return false;
    }
  }

  constructor(private renderer: Renderer) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    // this.column.nativeElement.parentElement.style.width = this.column.nativeElement.parentElement.clientWidth + 'px';
    this.renderer.listen(this.handle.nativeElement, 'mousedown', (event) => {
      this.renderer.setElementClass(this.handle.nativeElement, 'active', true);
      event.preventDefault();
      this.dragActive = true;
      this.orgX = event.clientX;
      this.orgWidth = this.column.nativeElement.parentElement.clientWidth;
    });
  }

}
