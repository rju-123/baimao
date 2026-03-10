<?php

namespace app\admin\controller\company;

use app\common\controller\Backend;

/**
 * 公司管理
 *
 * @icon fa fa-building
 */
class Company extends Backend
{
    protected $model = null;

    /** 快速搜索字段 */
    protected $searchFields = 'name,contact_name,contact_phone';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Company;
    }
}
