import { Package, Building, Users, Car, Coffee, Zap, Home, Briefcase, Banknote, User } from 'lucide-react';

export const IN_CATEGORIES = [
  { id: 'home_in', label: 'Home', icon: Home },
  { id: 'salary', label: 'Salary', icon: Briefcase },
  { id: 'rent_in', label: 'Rent', icon: Building },
  { id: 'business', label: 'Business', icon: Package },
  { id: 'interest', label: 'Interest', icon: Banknote },
  { id: 'other_in', label: 'Other', icon: User },
];

export const OUT_CATEGORIES = [
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'rent', label: 'Rent', icon: Building },
  { id: 'labour', label: 'Labour', icon: Users },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'food', label: 'Food', icon: Coffee },
  { id: 'electricity', label: 'Bill', icon: Zap },
  { id: 'household', label: 'Home', icon: Home },
];
