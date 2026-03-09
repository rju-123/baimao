<?php

namespace app\admin\controller\order;

use app\common\controller\Backend;
use app\admin\model\Whitehat as WhitehatModel;

/**
 * 订单管理
 *
 * @icon fa fa-file-text-o
 */
class Order extends Backend
{
    /**
     * Order 模型对象
     * @var \app\admin\model\Order
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Order;

        // 白帽子下拉列表：仅加载一次供视图使用
        $this->view->assign('whitehatList', WhitehatModel::whereNull('deletetime')->order('id', 'asc')->select());
    }

    /**
     * 编辑订单时，保存指派接单员的姓名和电话快照
     */
    public function edit($ids = null)
    {
        if ($ids === null) {
            $this->error(__('Parameter %s can not be empty', 'ids'));
        }
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        if ($this->request->isPost()) {
            $params = $this->request->post('row/a');
            if (!$params) {
                $this->error(__('Parameter %s can not be empty', 'row'));
            }
            $whitehatId = isset($params['whitehat_id']) ? (int)$params['whitehat_id'] : 0;
            if ($whitehatId > 0) {
                $whitehat = WhitehatModel::get($whitehatId);
                if ($whitehat) {
                    $params['whitehat_name'] = $whitehat['name'] ?? '';
                    $params['whitehat_phone'] = $whitehat['phone'] ?? '';
                }
            } else {
                $params['whitehat_id'] = 0;
                $params['whitehat_name'] = '';
                $params['whitehat_phone'] = '';
            }
            $result = $row->save($params);
            if ($result === false) {
                $this->error(__('No rows were updated'));
            }
            $this->success();
        }
        $this->view->assign('row', $row);
        return $this->view->fetch();
    }
}

