<?php

namespace app\admin\controller\sales;

use app\common\controller\Backend;
use app\admin\model\Company as CompanyModel;

/**
 * 销售人员管理（数据由小程序登录/选公司同步，仅列表与编辑所属公司）
 *
 * @icon fa fa-user-circle
 */
class Sales extends Backend
{
    protected $model = null;

    // 开启关联搜索，方便在列表中使用 company.name 字段
    protected $relationSearch = true;

    /** 快速搜索：姓名、电话 */
    protected $searchFields = 'name,phone';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Sales;
        $this->view->assign('companyList', CompanyModel::order('id', 'asc')->select());
    }

    /**
     * 仅允许编辑，不允许添加（数据来自小程序同步）
     */
    public function add()
    {
        $this->error('销售人员由小程序端登录/选公司后自动同步，无需在此添加');
    }
}
