import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { supabase } from '../../services/supabaseClient';
import { Sidebar } from '../../components/sidebar/sidebar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-saved-trips',
  standalone: true,
  imports: [CommonModule,FormsModule ,Sidebar],
  templateUrl: './saved-trips.html',
  styleUrls: ['./saved-trips.css'],
})
export class SavedTrips implements OnInit {

  loading = true;
  trips: any[] = [];

  // Modal State
  selectedTrip: any = null;
  showModal = false;

  // Delay / Skip State (Copied from Plan-Trip)
  showDelayPopup = false;
  delayInput: number | null = null;
  delayUnit: 'min' | 'hr' = 'min';
  delayTargetIndex: number | null = null;
  lastDelayTargetName: string | null = null;
  lastDelayConfig: { startIndex: number; minutes: number } | null = null;

  showSkipPopup = false;
  overflowActivities: { baseIndex: number; name: string }[] = [];
  skipSelection: number[] = [];

  baselineDays: number = 0;

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadTrips();
  }

  // Load all saved trips
  async loadTrips() {
    this.loading = true;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      this.trips = data || [];
    }

    this.loading = false;
  }

  // OPEN trip modal
  viewTrip(trip: any) {
    this.openTripModal(trip.plan);
  }

  openTripModal(plan: any) {
    this.selectedTrip = JSON.parse(JSON.stringify(plan)); // deep copy
    this.baselineDays = this.selectedTrip.itinerary.length;
    this.showModal = true;
  }

  // CLOSE trip modal
  closeModal() {
    this.showModal = false;
    this.selectedTrip = null;
  }

  // DELETE trip
  async deleteTrip(id: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (!error) {
      this.trips = this.trips.filter(t => t.id !== id);
      alert('Trip deleted successfully!');
    }
  }

  /* --------------------------------------------------------------------------
     DELAY LOGIC (Copied fully from Plan-Trip, adapted for saved itinerary)
  ---------------------------------------------------------------------------*/

  buildItineraryWithDelay(delayConfig?: { startIndex: number; minutes: number }) {
    const days = this.selectedTrip.itinerary;
    if (!days || days.length === 0) {
      return { plan: [], totalDays: 0, overflowActivities: [] };
    }

    const flat: any[] = [];
    days.forEach((d: any) => {
      d.activities.forEach((a: any) => flat.push(a));
    });

    let currentTime = null;
    let itineraryDays: any[] = [];
    let currentDay = 1;

    itineraryDays[currentDay] = {
      day: currentDay,
      title: `Day ${currentDay} in ${this.selectedTrip.destination}`,
      activities: []
    };

    let delayApplied = false;

    flat.forEach((act: any, idx: number) => {
      let start = act.startTime;
      let end = act.endTime;

      let startMinutes =
        parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
      let endMinutes =
        parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

      if (delayConfig && !delayApplied && idx >= delayConfig.startIndex) {
        startMinutes += delayConfig.minutes;
        endMinutes += delayConfig.minutes;
        delayApplied = true;
      }

      const newStart = this.fromMinutes(startMinutes);
      const newEnd = this.fromMinutes(endMinutes);

      // Check if overflow into next day
      if (endMinutes > 22 * 60) {
        currentDay++;
        itineraryDays[currentDay] = {
          day: currentDay,
          title: `Day ${currentDay} in ${this.selectedTrip.destination}`,
          activities: []
        };

        // Reset to morning
        const morning = 9 * 60;
        const newStart2 = this.fromMinutes(morning);
        const newEnd2 = this.fromMinutes(morning + (endMinutes - startMinutes));

        itineraryDays[currentDay].activities.push({
          ...act,
          startTime: newStart2,
          endTime: newEnd2,
          baseIndex: idx
        });

      } else {
        itineraryDays[currentDay].activities.push({
          ...act,
          startTime: newStart,
          endTime: newEnd,
          baseIndex: idx
        });
      }
    });

    const plan = Object.values(itineraryDays);
    const totalDays = plan.length;

    let overflow: any[] = [];
    if (totalDays > this.baselineDays) {
      const extraDays = plan.slice(this.baselineDays);
      extraDays.forEach((dy: any) => {
        dy.activities.forEach((a: any) => {
          overflow.push({ baseIndex: a.baseIndex, name: a.name });
        });
      });
    }

    return { plan, totalDays, overflowActivities: overflow };
  }

  fromMinutes(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  openDelayPopup(act: any) {
    this.delayTargetIndex = act.baseIndex;
    this.lastDelayTargetName = act.name;
    this.delayInput = null;
    this.delayUnit = 'min';
    this.showDelayPopup = true;
  }

  applyDelay() {
    if (this.delayInput === null || this.delayInput <= 0) {
      alert("Please enter valid delay");
      return;
    }

    let minutes = this.delayInput;
    if (this.delayUnit === "hr") minutes *= 60;

    const delayConfig = {
      startIndex: this.delayTargetIndex!,
      minutes
    };
    this.lastDelayConfig = delayConfig;

    const built = this.buildItineraryWithDelay(delayConfig);
    const newDays = built.totalDays;

    if (newDays > this.baselineDays && built.overflowActivities.length > 0) {
      this.overflowActivities = built.overflowActivities;
      this.showSkipPopup = true;
    } else {
      this.selectedTrip.itinerary = built.plan;
    }

    this.showDelayPopup = false;
  }

  toggleSkipSelection(baseIndex: number, checked: boolean) {
    if (checked) this.skipSelection.push(baseIndex);
    else this.skipSelection = this.skipSelection.filter(i => i !== baseIndex);
  }

  applySkip() {
    const skipSet = new Set(this.skipSelection);

    const flat = this.selectedTrip.itinerary
      .flatMap((d: any) => d.activities)
      .filter((a: any) => !skipSet.has(a.baseIndex));

    // rebuild in simple one-day format
    let currentDay = 1;
    this.selectedTrip.itinerary = [
      {
        day: 1,
        title: `Day 1 in ${this.selectedTrip.destination}`,
        activities: flat
      }
    ];

    this.showSkipPopup = false;
    this.skipSelection = [];
    this.overflowActivities = [];
  }


  /* --------------------------------------------------------------------------
     LIKE / SKIP / RATE ACTIONS (Copied from Plan-Trip)
  ---------------------------------------------------------------------------*/

  async likePlace(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Login required");

    await supabase.from("user_actions").insert({
      user_id: user.id,
      place_name: name,
      action_type: "like"
    });

    alert(`❤️ Liked ${name}`);
  }

  async skipPlace(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Login required");

    await supabase.from("user_actions").insert({
      user_id: user.id,
      place_name: name,
      action_type: "skip"
    });

    alert(`🚫 Skipped ${name}`);
  }

  async ratePlace(name: string, rating: number) {
    if (!rating) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Login required");

    await supabase.from("user_actions").insert({
      user_id: user.id,
      place_name: name,
      action_type: "rate",
      rating
    });

    alert(`⭐ Rated ${name}: ${rating}`);
  }

}
