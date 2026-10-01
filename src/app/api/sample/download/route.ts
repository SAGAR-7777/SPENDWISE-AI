import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "phonepe";

  let filename = "PhonePe_Statement_Demo.csv";
  let content = "";

  if (type === "hdfc") {
    filename = "HDFC_Bank_Statement_Demo.csv";
    content = `Date,Narration,Chq/Ref No,Value Date,Withdrawal Amt,Deposit Amt,Closing Balance
01/10/2024,SALARY CREDIT BY TECH LOGIC CORP,,01/10/2024,,75000.00,92400.00
02/10/2024,UPI-HOUSE RENT TO SUNITA VERMA-HDFC,428192831201,02/10/2024,15000.00,,77400.00
03/10/2024,ACH DEBIT BESCOM BILL PAYMENT,9482194812,03/10/2024,1480.00,,75920.00
04/10/2024,POS 42194812 ZEPTO QUICK DELIVERY BANGALORE,,04/10/2024,540.00,,75380.00
06/10/2024,UPI-SWIGGY-ORDER9214-ICICI,428192831202,06/10/2024,420.00,,74960.00
08/10/2024,POS 994821 NETFLIX ENTERTAINMENT MUMBAI,,08/10/2024,499.00,,74461.00
10/10/2024,UPI-UBER INDIA TECH RIDE-PAYTM,428192831203,10/10/2024,310.00,,74151.00
12/10/2024,ECOM-AMAZON PAY INDIA PURCHASE,,12/10/2024,2899.00,,71252.00
15/10/2024,UPI-SPOTIFY PREMIUM MONTHLY-HDFC,428192831204,15/10/2024,119.00,,71133.00
18/10/2024,UPI-ACT FIBERNET BROADBAND BILL,428192831205,18/10/2024,943.00,,70190.00
20/10/2024,UPI-ZOMATO LIMITED MEGHANA FOODS,428192831206,20/10/2024,680.00,,69510.00
22/10/2024,UPI-RAMESH TEA STALL CHAI-OKAXIS,428192831207,22/10/2024,40.00,,69470.00
24/10/2024,UPI-BLINKIT 10MIN GROCERY-YBL,428192831208,24/10/2024,650.00,,68820.00
26/10/2024,UPI-JIO 5G PREPAID RECHARGE,428192831209,26/10/2024,749.00,,68071.00
28/10/2024,NFS CASH WDL ATM INDIRANAGAR,,28/10/2024,2000.00,,66071.00`;
  } else {
    // PhonePe style CSV
    filename = "PhonePe_Statement_Demo.csv";
    content = `Date,Transaction Details,Type,Amount,Status
01-10-2024,SALARY CREDIT FROM ACME SYSTEMS,Credit,₹ 68000.00,COMPLETED
02-10-2024,Paid to House Rent Landlord,Debit,₹ 14000.00,COMPLETED
03-10-2024,Paid to BESCOM Electricity,Debit,₹ 1350.00,COMPLETED
04-10-2024,Paid to Zepto Quick Commerce,Debit,₹ 460.00,COMPLETED
05-10-2024,Paid to Swiggy Bangalore,Debit,₹ 380.00,COMPLETED
06-10-2024,Paid to Uber India Systems,Debit,₹ 290.00,COMPLETED
08-10-2024,Paid to Netflix Subscription,Debit,₹ 499.00,COMPLETED
09-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 30.00,COMPLETED
11-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 40.00,COMPLETED
12-10-2024,Paid to Blinkit Grocery,Debit,₹ 820.00,COMPLETED
14-10-2024,Paid to Spotify India,Debit,₹ 119.00,COMPLETED
15-10-2024,Paid to Zomato Food Delivery,Debit,₹ 580.00,COMPLETED
17-10-2024,Paid to Amazon Seller Services,Debit,₹ 3200.00,COMPLETED
19-10-2024,Paid to ACT Broadband Internet,Debit,₹ 943.00,COMPLETED
20-10-2024,Paid to Ola Cabs Prime,Debit,₹ 410.00,COMPLETED
22-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 50.00,COMPLETED
24-10-2024,Paid to Apollo Pharmacy,Debit,₹ 760.00,COMPLETED
25-10-2024,Paid to Decathlon Sports,Debit,₹ 1850.00,COMPLETED
27-10-2024,Paid to YouTube Premium Family,Debit,₹ 189.00,COMPLETED
28-10-2024,Paid to BigBasket Supermarket,Debit,₹ 2150.00,COMPLETED`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
