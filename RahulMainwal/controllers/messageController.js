const Messages = require("../models/messageModel");
const User = require("../models/userModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        time: msg.createdAt,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      timestamp: {
        date:
          new Date().getDate() +
          "-" +
          (parseInt(new Date().getMonth()) + 1) +
          "-" +
          new Date().getFullYear(),
        time:
          new Date().getHours() +
          ":" +
          new Date().getMinutes() +
          ":" +
          new Date().getSeconds(),
      },
    });

    // console.log(data);

    // // It is for sender
    // const users = await User.find({});
    // const filterData = await users.find((x) => {
    //   return x._id.toString() === from;
    // });
    // const filterContacts = await filterData.contacts.find((x) => {
    //   return x.id === to;
    // });
    // const filterallContacts = await filterData.contacts.filter((x) => {
    //   return x.id !== to;
    // });
    // filterallContacts.push({ id: to, block: false });

    // if (filterContacts === undefined) {
    //   await User.findByIdAndUpdate(
    //     { _id: from },
    //     {
    //       contacts: filterallContacts,
    //     }
    //   );
    // }

    // //It is for receiver

    // const filterRecData = await users.find((x) => {
    //   return x._id.toString() === to;
    // });
    // const filterRecContacts = await filterRecData.contacts.find((x) => {
    //   return x.id === from;
    // });
    // const filterallRecContacts = await filterRecData.contacts.filter((x) => {
    //   return x.id !== from;
    // });
    // filterallRecContacts.push({ id: from, block: false });

    // if (filterRecContacts === undefined) {
    //   await User.findByIdAndUpdate(
    //     { _id: to },
    //     {
    //       contacts: filterallRecContacts,
    //     }
    //   );
    // }

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};
