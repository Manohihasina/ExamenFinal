export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  password: string;
  remember_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface FirebaseAuthUser {
  uid: string;
  email: string;
  name: string;
  phone?: string | null;
  created_at: string;
  last_login_at?: string | null;
  disabled: boolean;
  email_verified: boolean;
}

export interface Car {
  id: number;
  client_id: number;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  color?: string;
  vin: string;
  status: 'available' | 'in_repair' | 'ready' | 'delivered';
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: number;
  name: string;
  price: number;
  duration_seconds: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepairSlot {
  id: number;
  slot_number: number;
  car_id?: number;
  status: 'available' | 'occupied' | 'waiting_payment';
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: number;
  car_id: number;
  intervention_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitingSlot {
  id: number;
  car_id?: number;
  total_cost: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_clients: number;
  repairs_in_progress: number;
  repairs_completed: number;
  repairs_pending: number;
  repairs_cancelled: number;
  total_interventions_amount: number;
  repairs_by_month: Record<string, number>;
  interventions_by_price: Record<string, number>;
}

export interface CarWithClient extends Car {
  client: Client;
}

export interface RepairWithDetails extends Repair {
  car: CarWithClient;
  intervention: Intervention;
}

export interface ClientRepairHistory {
  client: FirebaseAuthUser;
  repairs: ClientRepair[];
  statistics: {
    total_repairs: number;
    total_amount: number;
    completed_repairs: number;
    pending_repairs: number;
    in_progress_repairs: number;
  };
}

export interface ClientRepair {
  id: string;
  interventionId: string | null;
  interventionName: string;
  interventionPrice: number;
  interventionDuration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  carId: string;
  completedNotified: boolean;
  halfwayNotified: boolean;
  startedAt: string | null;
  completedAt: string | null;
  created_at: string | null;
  updated_at: string | null;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
}
