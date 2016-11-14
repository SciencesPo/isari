import { Component, Input, Output, OnInit, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';

@Component({
  selector: 'isari-pagination',
  templateUrl: './isari-pagination.component.html',
  styleUrls: ['./isari-pagination.component.css']
})
export class IsariPaginationComponent implements OnInit, OnChanges {

  totalPages: number;
  visiblePages = 5;
  pages: any[];

  @Input() itemsPerPage: number = 10;
  @Input() selectItemsPerPage: number[] = [3, 5, 10, 20, 50];
  @Input() totalItems: number;
  @Input() set currentPage(page: number) {
    this.navigate(page);
  }
  @Output() onPageChange = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemsPerPage'] || changes['totalItems']) {
      this.totalPages = this.calculateTotalPages();
      this.pages = this.getPages(1);
    }
  }

  navigate(page: number) {
    this.pages = this.getPages(page);
    this.onPageChange.emit({ page, itemsPerPage: this.itemsPerPage, totalItems: this.totalItems });
  }

  navigateNext() {
    let currentPage = this.pages.find(page => page.active);
    this.navigate(Math.min(this.totalPages, currentPage ? currentPage.number + 1 : 1));
  }

  navigatePrev() {
    let currentPage = this.pages.find(page => page.active);
    this.navigate(Math.max(1, currentPage ? currentPage.number - 1 : 1));
  }

  setItemsPerPage(ipp: number) {
    this.itemsPerPage = ipp;
    this.totalPages = this.calculateTotalPages();
    this.navigate(1);
  }

  private calculateTotalPages(): number {
    let totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil(this.totalItems / this.itemsPerPage);
    return Math.max(totalPages || 0, 1);
  }

  private getPages(currentPage: number): any[] {
    const pages = [];
    const visibleLinks = Math.min(this.visiblePages - 1, this.totalPages);
    let startPage = Math.max(currentPage - visibleLinks / 2, 1);
    let endPage = Math.min(currentPage + visibleLinks / 2, this.totalPages);
    if (startPage === 1) {
      endPage = Math.min(this.visiblePages, this.totalPages);
    }
    if (endPage === this.totalPages) {
      startPage = Math.max(1, this.totalPages - visibleLinks);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(this.createPage(i, null, i === currentPage));
    }
    if (startPage > 1) {
      pages.unshift(this.createPage(startPage - 1, '...'));
    }
    if (endPage < this.totalPages) {
      pages.push(this.createPage(endPage + 1, '...'));
    }
    return pages;
  }

  private createPage(number: number, text: string | null, active = false) {
    if (!text) {
      text = number.toString();
    }
    return { number, text, active };
  }


}
