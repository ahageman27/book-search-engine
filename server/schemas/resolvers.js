const { AuthenticationError } = require("apollo-server-express");
const User = require("../models/User");
const Book = require("../models/Book");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    user: async (parent, args, context) => {
      return await User.findOne({ _id: context.user._id });
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    updateUser: async (parent, args, context) => {
      if (context.user) {
        return await User.findByIdAndUpdate(context.user._id, args, {
          new: true,
        });
      }

      throw new AuthenticationError("Not logged in");
    },

    addBook: async (parent, args, context) => {
      if (context.user) {
        try {
          const wishlist = await Book.create(args);
          await User.findByIdAndUpdate(
            context.user._id,
            { $push: { savedBooks: wishlist } },
            {
              new: true,
            }
          );
          return wishlist;
        } catch (error) {
          console.log(error);
          return error;
        }
      }
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);

      return { token, user };
    },
  },
};

module.exports = resolvers;