INSERT OR IGNORE INTO users (id, email, pin_salt, pin_hash) VALUES (1, 'demo@tumblez.finance', 'tumblez-demo-salt-v1', 'fb3c639b385655eb3ca5d603e70bb7433bd1461491ff983e18a3ad0bfd4e7919');

INSERT OR IGNORE INTO assets (id,user_id,category,kind,name,account,value,notes) VALUES
  ('cash-concept-1',1,'cash','asset','เงินสำรองฉุกเฉิน','บัญชีสภาพคล่องหลัก',180000,'เป้าหมาย 6 เดือนของค่าใช้จ่าย'),
  ('cash-concept-2',1,'cash','asset','บัญชีใช้จ่ายประจำวัน','บัญชีธนาคารหลัก',42000,'ยอดสำหรับหมุนเวียน'),
  ('investment-concept-1',1,'investment','asset','กองทุนระยะยาว','พอร์ตลงทุน A',420000,'ติดตามผลตอบแทนรายเดือน'),
  ('investment-concept-2',1,'investment','asset','พอร์ตกระจายความเสี่ยง','พอร์ตลงทุน B',160000,'สัดส่วนหุ้นและตราสารหนี้'),
  ('personal-concept-1',1,'personal','asset','ที่อยู่อาศัย','เอกสารทรัพย์สิน',2800000,'มูลค่าประเมินล่าสุด'),
  ('personal-concept-2',1,'personal','asset','ยานพาหนะ','เอกสารทรัพย์สิน',520000,'มูลค่าประเมินปัจจุบัน'),
  ('debt-concept-1',1,'debt','liability','สินเชื่อที่อยู่อาศัย','สัญญาสินเชื่อ A',1650000,'ทบทวนยอดคงเหลือทุกเดือน'),
  ('debt-concept-2',1,'debt','liability','สินเชื่อยานพาหนะ','สัญญาสินเชื่อ B',210000,'เหลือระยะเวลาผ่อนตามสัญญา');

INSERT OR IGNORE INTO cards (id,user_id,bank,name,last_four,expiry,statement_day,due_day,credit_limit,tone,logo) VALUES
  ('card-concept-primary',1,'Primary Bank','Everyday Card','1284','2028-12',15,5,100000,'ink','/assets/banks/primary-bank.svg'),
  ('card-concept-travel',1,'Travel Bank','Travel Rewards','5702','2029-06',22,7,150000,'violet','/assets/banks/travel-bank.svg'),
  ('card-concept-digital',1,'Digital Bank','Digital Flex','9341','2027-10',28,13,70000,'teal','/assets/banks/digital-bank.svg');

INSERT OR IGNORE INTO installments (id,user_id,name,statement_name,category,card_id,total_price,interest,total_installments,paid_installments) VALUES
  ('item-concept-work',1,'อุปกรณ์ทำงาน','WORK EQUIPMENT','Gadget','card-concept-primary',36000,0,10,3),
  ('item-concept-home',1,'เครื่องใช้ในบ้าน','HOME LIVING','เครื่องใช้ไฟฟ้า','card-concept-digital',8400,0,6,2),
  ('item-concept-trip',1,'ทริปพักผ่อนประจำปี','ANNUAL TRIP','ท่องเที่ยว','card-concept-travel',24000,600,12,4),
  ('item-concept-health',1,'แพ็กเกจสุขภาพ','HEALTH PLAN','สุขภาพ','card-concept-primary',12000,0,6,6);

