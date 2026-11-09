export type ItemCategory =
  | 'housing'
  | 'vehicle'
  | 'pet'
  | 'tech'
  | 'lifestyle'
  | 'vice';

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  priceUSD: number;
  annualUpkeepUSD?: number;
  minAge?: number;
  minSmarts?: number;
  statBonus?: {
    health?: number;
    happiness?: number;
    smarts?: number;
    social?: number;
  };
  icon: string;
  tag?: string;
  isOneTime?: boolean;
  pixelArtEffect?: {
    housingType?: string;
    vehicleType?: 'bike' | 'moto' | 'car';
    petType?: 'd' | 'c' | 'h' | 'r' | 'b' | 'f';
  };
}

export interface PlayerInventory {
  items: string[];
  currentHousingId?: string;
  currentVehicleId?: string;
  currentPetId?: string;
}
