const { usersSchema } = require("../models/mongodb");
const axios = require("axios");
const checkEmail = async (email) => {
  try {
    const { data } = await axios.get(
      `https://leakcheck.io/api/public?check=${email}`
    );
    return data;
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
};

const resolvers = {
  // Ambil semua user
  getUserLeak: async ({ userEmail }) => {
    const doc = await usersSchema.findOne({ "users.leakEmailUser": userEmail });
    if (!doc) return [];

    const user = doc.users.find((u) => u.leakEmailUser === userEmail);
    if (!user) return [];

    const leaks = user.leakItems.map((item) => {
      const phone = Object.keys(item)[0];
      const data = item[phone];
      return {
        phone,
        email: data.email,
        status: data.status,
        leakStatus: data.leakStatus,
        leakLocation: data.leakLocation || [],
      };
    });

    return leaks;
  },

  // Ambil satu user berdasarkan phone
  user: async ({ phone, userEmail }) => {
    try {
      const doc = await usersSchema.findOne({
        "users.leakEmailUser": userEmail,
      });
      const userIndex = doc.users.findIndex(
        (u) => u.leakEmailUser === userEmail
      );

      if (userIndex === -1)
        return {
          message: "User not found",
        };

        
    } catch (error) {
      console.error("Error fetching user:", error);
      return null; // or handle the error as needed
    }
  },

  // Tambah atau Update user
  addLeakItem: async ({
    userEmail,
    phone,
    email,
    status = 1,
    leakStatus = 1,
  }) => {
    let doc = await usersSchema.findOne({ "users.leakEmailUser": userEmail });

    // Buat dokumen baru jika user belum ada
    if (!doc) {
      doc = await usersSchema.create({
        users: [{ leakEmailUser: userEmail, leakItems: [], leakVerified: 0 }],
      });
    }

    let userIndex = doc.users.findIndex((u) => u.leakEmailUser === userEmail);

    // Tambah user ke array jika belum ada dalam dokumen
    if (userIndex === -1) {
      doc.users.push({ leakEmailUser: userEmail, leakItems: [], leakVerified: 0 });
      doc.markModified("users");
      await doc.save();
      userIndex = doc.users.findIndex((u) => u.leakEmailUser === userEmail);
    }

    const existingItems = doc.users[userIndex].leakItems;
    const findEmailLeak = existingItems.find((item) => {
      const key = Object.keys(item)[0];
      return item[key].email === email;
    });
    const findPhone = existingItems.find((item) => Object.keys(item)[0] === phone);
    if (findEmailLeak || findPhone) {
      return {
        message: "Email or phone already exists",
        email,
        status,
      };
    }

    // Buat objek baru
    const newLeakItem = {
      [phone]: {
        email,
        status,
        leakStatus,
        leakLocation: [],
      },
    };

    // Tambah ke leakItems
    const leakItems = existingItems;
    leakItems.push(newLeakItem);
    doc.markModified("users");
    await doc.save();

    return {
      // message: "Success Add Data",
      phone,
      email,
      // status,
    };
  },

  // Update status user
  updateLeakStatus: async ({ userEmail, phone }) => {
    try {
      const doc = await usersSchema.findOne({
        "users.leakEmailUser": userEmail,
      });
      const userIndex = doc.users.findIndex(
        (u) => u.leakEmailUser === userEmail
      );

      if (userIndex === -1)
        return {
          message: "User not found",
        };

      const leakItems = doc.users[userIndex].leakItems;

      // Update status
      leakItems.forEach((item) => {
        Object.keys(item).forEach((key) => {
          for (const p of phone) {
            if (key === p) {
              item[key].status = 2;
            }
          }
        });
      });

      // Check email
      const resultLeakEmail = [];
      leakItems.forEach((item) => {
        Object.keys(item).forEach((key) => {
          for (const p of phone) {
            if (key === p) {
              resultLeakEmail.push({ phone: key, email: item[key].email });
            }
          }
        });
      });

      if (resultLeakEmail.length === 0) {
        return {
          message: "Email not found",
        };
      }

      // Check email leak
      let dataResult = await Promise.all(
        resultLeakEmail.map(async (result) => {
          try {
            return {
              email: result.email,
              phone: result.phone,
              data: await checkEmail(result.email),
            };
          } catch (error) {
            console.error("Error checking email:", error);
            return null; // atau handle sesuai kebutuhan
          }
        })
      );

      if (dataResult.length === 0) {
        return {
          message: "Email not found",
        };
      }

      // Update leakStatus && leakLocation
      dataResult.map((item) => {
        const { phone, email, data } = item;

        if (data.found > 0) {
          // Normalisasi sources: bisa string atau object {name, date}
          const sources = (data.sources || []).map((s) =>
            typeof s === "string" ? s : s.name || JSON.stringify(s)
          );
          leakItems.map((item) => {
            Object.keys(item).map((key) => {
              if (key === phone) {
                item[key].leakStatus = 1;
                item[key].leakLocation = sources;
                item[key].status = 3;
              }
            });
          });
          console.log(`Mengirim notifikasi ke ${phone}`);
        }
        leakItems.map((item) => {
          Object.keys(item).map((key) => {
            if (key === phone) {
              item[key].status = 3;
            }
          });
        });
      });
      doc.markModified("users");
      await doc.save();

      return {
        message: "Success Update Data",
      };
    } catch (error) {
      return {
        message: "Error updating leak status",
        error: error.message,
      };
    }
  },

  // Hapus user
  deleteUser: async ({ phone }) => {
    const doc = await usersSchema.findOne({ [`users.${phone}`]: { $exists: true } });
    if (!doc) return false;

    doc.users = doc.users.filter((u) => u.leakEmailUser !== phone);
    doc.markModified("users");
    await doc.save();

    return true;
  },

  scanedEmail: async ({ phone }) => {
    const doc = await usersSchema.find({
      [phone]: { $exists: true },
    });

    let dataObj;

    for (const d of doc) {
      const data = d.toObject();
      delete data._id;
      delete data.__v;
      dataObj = data;
    }

    const email = dataObj[phone].email;
    const data = await checkEmail(email);
    console.log(data);

    if (data.found == 0) {
      return [
        {
          email,
          status: dataObj[phone].status,
          leak: data.found,
        },
      ];
    }
    return [
      {
        email,
        status: dataObj[phone].status,
        leak: data.found,
      },
    ];
  },
};

module.exports = resolvers;
