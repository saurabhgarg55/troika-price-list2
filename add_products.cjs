const fs = require('fs');

const newData = {
  "Sheet1": [
    { "Code": "HD 381 SY", "Name": "One Pc Set Hades", "Size": "645*365*760", "Mrp": 28795 },
    { "Code": "EU 4581 SY", "Name": "One Pc Set Eureka", "Size": "680*390*780", "Mrp": 34995 },
    { "Code": "HL 8581 SY", "Name": "One Pc Set Helios", "Size": "685*380*775", "Mrp": 36795 },
    { "Code": "AR 6581 SY", "Name": "One Pc Set Aries", "Size": "680*380*770", "Mrp": 36795 },
    { "Code": "CU 881 SY", "Name": "One Pc Set Cupid", "Size": "720*380*740", "Mrp": 38995 },
    { "Code": "OL 3081 SY", "Name": "One Pc Set Olga", "Size": "680*360*700", "Mrp": 38995 },
    { "Code": "NP 481 SY", "Name": "One Pc Set Benito/Neptune", "Size": "665*350*750", "Mrp": 23495 },
    { "Code": "ZE 591", "Name": "Wall Hung Winta/Zeus", "Size": "485*355*360", "Mrp": 17275 },
    { "Code": "NK 7591", "Name": "Wall Hung Nike ", "Size": "505*365*350", "Mrp": 20995 },
    { "Code": "NK 7574", "Name": " Table Top Basin Nike T.H.", "Size": "475*365*125", "Mrp": 7595 },
    { "Code": "ZE 574", "Name": " Table Top Basin Zeus", "Size": "410*410*140", "Mrp": 7995 },
    { "Code": "HD 374", "Name": " Table Top Basin Hades", "Size": "463*325*135", "Mrp": 7395 },
    { "Code": "VN 7474", "Name": " Table Top Basin Fonza/Venus", "Size": "480*390*150", "Mrp": 7695 },
    { "Code": "VC 6974", "Name": " Table Top Basin Kuma/Valcun T.H.", "Size": "455*355*130", "Mrp": 7195 },
    { "Code": "HL 8574", "Name": " Table Top Basin Erich/Hellios", "Size": "520*405*160", "Mrp": 8195 },
    { "Code": "ZE 571+77", "Name": " Wash Basin Zeus & Pedestal", "Size": "510*400*770", "Mrp": 8595 },
    { "Code": "ZE 77", "Name": " Pedestal Zeus", "Size": null, "Mrp": 4165 },
    { "Code": "EU 4571+77", "Name": " Wash Basin Eureka & Pedestal", "Size": "562*435*830", "Mrp": 9495 },
    { "Code": "VC 6971+77", "Name": " Wash Basin Vulcan & Pedestal", "Size": "550*410*845", "Mrp": 10495 },
    { "Code": "EU/VC 77", "Name": " Pedestal EU/VC", "Size": null, "Mrp": 4595 },
    { "Code": "ET 6871", "Name": " Wash Basin Rolf/Eather", "Size": "410*320*145", "Mrp": 3495 },
    { "Code": "CU 871", "Name": " Wash Basin Marit/Cupid", "Size": "355*305*135", "Mrp": 4695 },
    { "Code": "ET/CU 77", "Name": " Pedestal Bruno Square/Et & CU", "Size": null, "Mrp": 4195 },
    { "Code": "HE 6371", "Name": " Wash Basin Tuscon/Hera W Hung", "Size": "480*360*180", "Mrp": 3095 },
    { "Code": null, "Name": " Corner Wash Basin Otis/Round", "Size": "1525 14*17", "Mrp": 3295 },
    { "Code": "ZE 575", "Name": " Integrated Wash Basin Zeus", "Size": "475*425*360", "Mrp": 9995 },
    { "Code": "VC 6975", "Name": " Integrated Wash Basin Vulcan", "Size": "500*425*360", "Mrp": 10895 },
    { "Code": null, "Name": "Urinal Lars/Venus", "Size": "290*285*405", "Mrp": 4695 },
    { "Code": null, "Name": "Ladies Urinal Jessen", "Size": "490*380*110", "Mrp": 4995 },
    { "Code": null, "Name": "City Pan", "Size": "530*430*190", "Mrp": 3695 },
    { "Code": null, "Name": "Orrisa Pan", "Size": "525*430*240", "Mrp": 3495 },
    { "Code": null, "Name": "P Trap", "Size": null, "Mrp": 795 }
  ]
};

const existingProducts = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const formattedNewProducts = newData.Sheet1.map(p => ({
  code: p.Code ? p.Code.trim() : `SW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  name: p.Name.trim(),
  size: p.Size,
  price: p.Mrp,
  category: "Sanitary Ware"
}));

const combined = [...existingProducts, ...formattedNewProducts];
fs.writeFileSync('src/data/products.json', JSON.stringify(combined, null, 2));
