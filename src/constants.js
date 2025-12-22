import { Package, Building, Users, Car, Coffee, Zap, Home, Briefcase, Banknote, User, Smartphone, HeartPulse, GraduationCap, Plane, Clapperboard, ShoppingBag, Gift, CreditCard } from 'lucide-react';

export const IN_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: Briefcase },
  { id: 'business', label: 'Business', icon: Package },
  { id: 'rent_in', label: 'Rent', icon: Building },
  { id: 'home_in', label: 'Home', icon: Home },
  { id: 'interest', label: 'Interest', icon: Banknote },
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'loan', label: 'Loan', icon: CreditCard },
  { id: 'sales', label: 'Sales', icon: ShoppingBag },
  { id: 'other_in', label: 'Other', icon: User },
];

export const OUT_CATEGORIES = [
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'food', label: 'Food', icon: Coffee },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'rent', label: 'Rent', icon: Building },
  { id: 'labour', label: 'Labour', icon: Users },
  { id: 'electricity', label: 'Bill', icon: Zap },
  { id: 'recharge', label: 'Recharge', icon: Smartphone },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'entertainment', label: 'Fun', icon: Clapperboard },
  { id: 'household', label: 'Home', icon: Home },
];
