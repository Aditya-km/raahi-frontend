import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule,Sidebar],
  templateUrl: './discover.html',
  styleUrls: ['./discover.css'],
})
export class Discover implements OnInit {
  loading = true;
  selectedCity = 'Coorg';
  destinations: any[] = [];
  cities = ['Coorg', 'Chikkamagaluru', 'Bengaluru'];

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadDestinations(this.selectedCity);
  }

  async loadDestinations(city: string) {
    this.loading = true;
    this.selectedCity = city;

    try {
      // ✅ Directly load fallback data (no API)
const slug = this.CITY_SLUG_MAP[city];
const res = await fetch(`/assets/places/${slug}_places.json`);
const data = await res.json();

this.destinations = this.extractPlaceNames(data);
    } catch (err) {
      console.error('Error loading destinations:', err);
      this.destinations = [];
    } finally {
      this.loading = false;
    }
  }

  getCityImage(city: string) {
    switch (city) {
      case 'Coorg':
        return 'assets/coorg.jpg';
      case 'Chikkamagaluru':
        return 'assets/chikkamagaluru.jpg';
      case 'Bengaluru':
        return 'assets/bengaluru.jpg';
      default:
        return 'assets/default.jpg';
    }
  }

  extractPlaceNames(data: any): any[] {
  const names: { name: string }[] = [];

  if (!data?.circuits) return names;

  Object.values(data.circuits).forEach((c: any) => {
    if (Array.isArray(c.places_detailed)) {
      c.places_detailed.forEach((p: any) => {
        if (p?.name) {
          names.push({ name: p.name });
        }
      });
    }
  });

  return names;
}

  private CITY_SLUG_MAP: Record<string, string> = {
  Coorg: 'coorg',
  Chikkamagaluru: 'chikkamagaluru',
  Bengaluru: 'bangalore',
};

  

  goToPlan() {
    this.router.navigate(['/plan']);
  }
}
