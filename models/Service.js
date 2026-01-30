const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    variants: {
      type: [
        {
          label: String,
          count: Number,
          price: Number,
        },
      ],
      default: [], // 🔥 MUHIM
    },
  },
  { timestamps: true },
);
