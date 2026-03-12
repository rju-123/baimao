<?php

namespace app\admin\controller\points;

use app\common\controller\Backend;

/**
 * 积分商品管理
 *
 * @icon fa fa-gift
 */
class Mallitem extends Backend
{
    /**
     * @var \app\admin\model\PointsMallItem
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\PointsMallItem;
    }
}

