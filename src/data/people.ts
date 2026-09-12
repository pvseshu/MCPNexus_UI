import { DirectoryPerson } from '../types';

// Mock enterprise directory used to back the Application Owner typeahead.
// In production this would resolve against the corporate identity/HR API.
export const DIRECTORY_PEOPLE: DirectoryPerson[] = [
  { id: 'p-1', name: 'Priya Nair', email: 'priya.nair@aexp.com', title: 'Product Owner', team: 'Customer Experience Team' },
  { id: 'p-2', name: 'Daniel Ortiz', email: 'daniel.ortiz@aexp.com', title: 'Engineering Lead', team: 'Operations & Escalations Team' },
  { id: 'p-3', name: 'Wei Zhang', email: 'wei.zhang@aexp.com', title: 'Security Architect', team: 'Information Security & Identity' },
  { id: 'p-4', name: 'Amara Okafor', email: 'amara.okafor@aexp.com', title: 'Engineering Manager', team: 'Core Banking Engineering' },
  { id: 'p-5', name: 'Liam Fitzgerald', email: 'liam.fitzgerald@aexp.com', title: 'Product Manager', team: 'Digital Engagement Team' },
  { id: 'p-6', name: 'Sofia Marchetti', email: 'sofia.marchetti@aexp.com', title: 'Platform Owner', team: 'Enterprise AI Center of Excellence' },
  { id: 'p-7', name: 'Rahul Mehta', email: 'rahul.mehta@aexp.com', title: 'DevOps Lead', team: 'DevOps & Cloud SRE' },
  { id: 'p-8', name: 'Grace Kim', email: 'grace.kim@aexp.com', title: 'Governance Lead', team: 'Cybersecurity Governance' },
];
