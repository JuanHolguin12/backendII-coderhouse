export class TicketDto {
  constructor(ticket) {
    this.id = ticket._id || ticket.id;
    this.user = ticket.user;
    
    // Check if event is populated
    this.event = ticket.event?._id 
      ? {
          id: ticket.event._id,
          title: ticket.event.title,
          date: ticket.event.date,
          location: ticket.event.location,
        }
      : ticket.event;

    this.status = ticket.status;
    this.quantity = ticket.quantity;
    this.reservationCode = ticket.reservationCode;
    this.createdAt = ticket.createdAt;
    this.cancelledAt = ticket.cancelledAt;
  }
}
