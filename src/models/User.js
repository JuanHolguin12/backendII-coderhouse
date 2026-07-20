export class User {
  constructor({ firstName, lastName, email, password, role = "user" }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
  }
}
