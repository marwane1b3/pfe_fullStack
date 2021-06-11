const { Category } = require('../models/category');
const { Product } = require('../models/product');

const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    res.status(500).json({ success: false });
  }
  res.send(categoryList);
});

router.get('/:id', async (req, res) => {
  try {
    const singleCategory = await Category.findById(req.params.id);

    if (singleCategory) {
      res.status(200).json({ success: true, payload: singleCategory });
      // console.log(singleCategory.populated('product'));
    } else {
      throw new Error('Category not found');
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});
router.get('/products/:id', async (req, res) => {
  try {
    await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',

          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          products: '$products',
          totalProducts: { $size: '$products' }
        }
      }
    ]).exec(function(err, results) {
      if (err) {
        throw err;
      }
      res.send({ data: results });
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  // const productIds = Promise.all(
  //     req.body.products.map(async item => {
  //       let newProduct = new Product({
  //         name: item.name,
  //     description: item.description,
  //     richDescription: item.richDescription,
  //     image: item.image,
  //     brand: item.brand,
  //     price: item.price,
  //     category: item.category,
  //     countInStock: item.countInStock,
  //     rating: item.rating,
  //     numReviews: item.numReviews,
  //     isFeatured: item.isFeatured
  //       });
  //       newProduct = await newProduct.save();
  //       return newProduct._id;
  //     })
  //   );
  //   const resolvedProducts = await productIds;

  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color
  });

  category = await category.save();
  if (!category) {
    return res.status(404).send('failed to create category');
  }
  res.send(category);
});

router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
      },
      { new: true }
    );
    if (category) {
      res.status(200).send(category);
    } else {
      throw new Error('failed to update');
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then(deletedCat => {
      if (deletedCat) {
        return res.status(200).json({
          sucess: true,
          msg: `category ${deletedCat.name} was successfully deleted`
        });
      } else {
        return res
          .status(404)
          .json({ success: false, msg: `failed to delete ${deletedCat.name}` });
      }
    })
    .catch(err => {
      return res.status(500).json({ success: false, message: err.message });
    });
});

module.exports = router;
