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

    /**
     * 列表：补充关联显示用户姓名、商品名称
     */
    public function index()
    {
        if ($this->request->isAjax()) {
            if ($this->request->request('keyField')) {
                return $this->selectpage();
            }

            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $list = $this->model
                ->alias('e')
                // 用户姓名优先取销售表 fa_sales.name，兜底 fa_user.nickname
                ->join('__SALES__ s', 's.id = e.userId', 'LEFT')
                ->join('__USER__ u', 'u.id = e.userId', 'LEFT')
                ->join('fa_points_mall_items i', 'i.id = e.itemId', 'LEFT')
                ->where($where)
                ->field("e.*, IFNULL(NULLIF(s.name, ''), IFNULL(NULLIF(u.nickname, ''), '-')) AS userName, IFNULL(NULLIF(i.name, ''), '-') AS itemName")
                ->order($sort, $order)
                ->paginate($limit);

            $result = [
                'total' => $list->total(),
                'rows'  => $list->items(),
            ];
            return json($result);
        }

        return $this->view->fetch();
    }

    /**
     * 编辑页：补充只读展示用户姓名、商品名称
     */
    public function edit($ids = null)
    {
        if ($this->request->isPost()) {
            return parent::edit($ids);
        }

        $id = $ids ?: $this->request->param('ids');
        $row = $this->model
            ->alias('e')
            ->join('__SALES__ s', 's.id = e.userId', 'LEFT')
            ->join('__USER__ u', 'u.id = e.userId', 'LEFT')
            ->join('fa_points_mall_items i', 'i.id = e.itemId', 'LEFT')
            ->where('e.id', (int)$id)
            ->field("e.*, IFNULL(NULLIF(s.name, ''), IFNULL(NULLIF(u.nickname, ''), '-')) AS userName, IFNULL(NULLIF(i.name, ''), '-') AS itemName")
            ->find();

        if (!$row) {
            $this->error(__('No Results were found'));
        }

        $this->view->assign('row', $row->toArray());
        return $this->view->fetch();
    }
}

