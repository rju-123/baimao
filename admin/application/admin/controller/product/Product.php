<?php

namespace app\admin\controller\product;

use app\common\controller\Backend;

/**
 * 产品管理
 *
 * @icon fa fa-cube
 */
class Product extends Backend
{
    /**
     * Product 模型对象
     * @var \app\admin\model\Product
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Product;
    }
}

