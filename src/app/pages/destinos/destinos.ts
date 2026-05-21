import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { G7ApiService, DestinoDto } from '../../core/g7-api.service';

interface Slide {
  id: string;
  bg: string;
  thumb: string;
  label: string;
  title: string;
  desc: string;
  name: string;
}

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './destinos.html',
  styleUrl: './destinos.css',
})
export class Destinos implements OnInit, OnDestroy {
  currentIndex = 0;
  private autoTimer: ReturnType<typeof setInterval> | undefined;

  slides: Slide[] = [];

  cargando = true;
  error: string | null = null;

  private readonly fallback: Slide[] = [

  ];

  constructor(private readonly api: G7ApiService) {}

  ngOnInit(): void {
    this.api.getDestinos().subscribe({
      next: (list) => {
        this.slides = list.map((d) => this.mapDestino(d));
        if (this.slides.length === 0) {
          this.slides = [...this.fallback];
        }
        this.cargando = false;
        this.resetAuto();
      },
      error: () => {
        this.error = 'No se pudieron cargar los destinos desde el servidor.';
        this.slides = [...this.fallback];
        this.cargando = false;
        this.resetAuto();
      },
    });
  }

  private mapDestino(d: DestinoDto): Slide {
    const titlePlain = d.title ?? '';
    const title =
      titlePlain.includes('<') ? titlePlain : titlePlain.replace(' ', '<br>');
    return {
      id: d.id,
      bg: d.bg,
      thumb: d.thumb,
      label: d.label,
      title,
      desc: d.desc,
      name: d.name,
    };
  }

  ngOnDestroy(): void {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  goTo(index: number): void {
    if (this.slides.length === 0) return;
    this.currentIndex = (index + this.slides.length) % this.slides.length;
    this.resetAuto();
  }

  private resetAuto(): void {
    if (this.autoTimer) clearInterval(this.autoTimer);
    if (this.slides.length <= 1) return;
    this.autoTimer = setInterval(() => this.goTo(this.currentIndex + 1), 5000);
  }

  get statusText(): string {
    if (this.slides.length === 0) return '00 / 00';
    const cur = String(this.currentIndex + 1).padStart(2, '0');
    const tot = String(this.slides.length).padStart(2, '0');
    return `${cur} / ${tot}`;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.goTo(this.currentIndex - 1);
    if (e.key === 'ArrowRight') this.goTo(this.currentIndex + 1);
  }

  private startX = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.startX = e.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent): void {
    const diff = this.startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      this.goTo(diff > 0 ? this.currentIndex + 1 : this.currentIndex - 1);
    }
  }
}
