import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatBubble } from './components/chat-bubble/chat-bubble';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatBubble],
  templateUrl: './app.html',     // ✅ use external file
  styleUrls: ['./app.css'],      // optional if you have CSS
})
export class App {}
