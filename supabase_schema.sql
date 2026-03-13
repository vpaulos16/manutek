-- ServiTrak Supabase Database Schema

-- 1. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  document TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  voltage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Technicians Table
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Work Orders (OS) Table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number SERIAL, -- Auto-incrementing OS number
  customer_id UUID NOT NULL REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  technician_id UUID REFERENCES technicians(id),
  status TEXT NOT NULL DEFAULT 'received',
  reported_defect TEXT NOT NULL,
  service_description TEXT,
  technical_diagnostic TEXT,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  is_under_warranty BOOLEAN DEFAULT FALSE,
  has_invoice BOOLEAN DEFAULT FALSE,
  product_condition JSONB DEFAULT '{}'::jsonb,
  accessories JSONB DEFAULT '{}'::jsonb,
  terms_accepted BOOLEAN DEFAULT FALSE,
  attendant_id UUID,
  priority TEXT DEFAULT 'normal',
  service_origin TEXT DEFAULT 'balcao',
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ready_for_pickup_date TIMESTAMP WITH TIME ZONE,
  days_pending INTEGER DEFAULT 0,
  billing_status TEXT,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  total_storage_fee DECIMAL(10,2) DEFAULT 0,
  last_fee_calculation_date TIMESTAMP WITH TIME ZONE,
  entry_images TEXT[] DEFAULT '{}',
  status_entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repair_description TEXT,
  repair_date TIMESTAMP WITH TIME ZONE,
  service_time TEXT,
  attendant_name TEXT
);

-- 5. Parts Table
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Work Order Items (Many-to-Many parts used in an OS)
CREATE TABLE work_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- 7. Work Order History (Traceability)
CREATE TABLE work_order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  type TEXT, -- 'status', 'edit', 'note'
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  user_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT
);

-- 8. Communication Logs (WhatsApp Tracking)
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'delivered', 'read', 'received'
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for Work Orders
alter publication supabase_realtime add table work_orders;
alter publication supabase_realtime add table work_order_history;
alter publication supabase_realtime add table communication_logs;
