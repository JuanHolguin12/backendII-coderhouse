export class Event {
  constructor({ title, description, date, location, capacity, organizerId }) {
    this.title = title;
    this.description = description;
    this.date = date;
    this.location = location;
    this.capacity = capacity;
    this.organizerId = organizerId;
  }
}
