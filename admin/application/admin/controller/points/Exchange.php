<?php

namespace app\admin\controller\points;

use app\common\controller\Backend;

/**
 * 积分兑换记录
 *
 * @icon fa fa-list
 */
class Exchange extends Backend
{
    /**
     * @var \app\admin\model\ExchangeRecord
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\ExchangeRecord;
    }
}

