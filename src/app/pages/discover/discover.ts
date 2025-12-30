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
      this.destinations = this.getFallbackDestinations(city);
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

  // ✅ Static local destinations
  getFallbackDestinations(city: string) {
    const places: any = {
      Coorg: [
        {
          name: 'Abbey Falls',
          description: 'A stunning waterfall nestled amidst coffee plantations.',
          image: 'assets/coorg.jpg',
        },
        {
          name: 'Dubare Elephant Camp',
          description: 'Interact with elephants along the banks of the Cauvery River.',
          image: 'assets/coorg.jpg',
        },
        {
          name: 'Raja’s Seat',
          description: 'A beautiful garden offering breathtaking sunset views.',
          image: 'assets/coorg.jpg',
        },
      ],
      Chikkamagaluru: [
        {
          name: 'Mullayanagiri Peak',
          description: 'The highest peak in Karnataka, known for cool breezes and views.',
          image: 'assets/chikkamagaluru.jpg',
        },
        {
          name: 'Hebbe Falls',
          description: 'A hidden gem surrounded by dense forests and coffee estates.',
          image: 'assets/chikkamagaluru.jpg',
        },
        {
          name: 'Baba Budangiri',
          description: 'Mountain range famous for trekking and sacred shrines.',
          image: 'assets/chikkamagaluru.jpg',
        },
      ],
      Bengaluru: [
        {
          name: 'Cubbon Park',
          description: 'A serene green oasis in the middle of the bustling city.',
          image: 'assets/bengaluru.jpg',
        },
        {
          name: 'Lalbagh Botanical Garden',
          description: 'A heritage garden with an iconic glasshouse and floral displays.',
          image: 'assets/bengaluru.jpg',
        },
        {
          name: 'Nandi Hills',
          description: 'A scenic hill station for sunrise lovers and cyclists.',
          image: 'assets/bengaluru.jpg',
        },
      ],
    };
    return places[city] || [];
  }

  goToPlan() {
    this.router.navigate(['/plan']);
  }
}
