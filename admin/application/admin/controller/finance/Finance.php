<?php

namespace app\admin\controller\finance;

use app\common\controller\Backend;
use app\admin\model\Order as OrderModel;

/**
 * 财务看板
 *
 * 使用独立流水表，支持增删改查和统计。
 */
class Finance extends Backend
{
    /**
     * @var \app\admin\model\FinanceFlow
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\FinanceFlow;
        // 订单下拉列表：用于新增/编辑流水时选择关联订单
        $orderList = OrderModel::order('id', 'desc')->select();
        $this->view->assign('orderList', $orderList);
    }

    /**
     * 财务看板首页
     */
    public function index()
    {
        // 统计区间：当前自然月
        $startOfMonth = date('Y-m-01');
        $endOfMonth   = date('Y-m-t');

        // 顶部汇总
        $summary = [
            // 总应收款：所有应收流水金额之和
            'total_receivable' => (float)$this->model->where('type', 'receivable')->sum('amount'),
            // 总应付款：所有应付流水金额之和
            'total_payable'    => (float)$this->model->where('type', 'payable')->sum('amount'),
            // 本月已回款：本月内已结算的应收款
            'month_received'   => (float)$this->model
                ->where('type', 'receivable')
                ->where('status', 'settled')
                ->where('flow_date', '>=', $startOfMonth)
                ->where('flow_date', '<=', $endOfMonth)
                ->sum('amount'),
            // 本月已结算：本月内已结算的应付款
            'month_settled'    => (float)$this->model
                ->where('type', 'payable')
                ->where('status', 'settled')
                ->where('flow_date', '>=', $startOfMonth)
                ->where('flow_date', '<=', $endOfMonth)
                ->sum('amount'),
        ];

        // 列表数据：按日期倒序展示全部流水（或视需要限制条数）
        $receivables = $this->model
            ->where('type', 'receivable')
            ->order('flow_date', 'desc')
            ->order('id', 'desc')
            ->select();

        $payables = $this->model
            ->where('type', 'payable')
            ->order('flow_date', 'desc')
            ->order('id', 'desc')
            ->select();

        $this->view->assign('summary', $summary);
        $this->view->assign('receivables', $receivables);
        $this->view->assign('payables', $payables);

        return $this->view->fetch();
    }
}

