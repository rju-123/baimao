<?php

namespace app\admin\model;

use think\Model;

class Order extends Model
{
    // 表名
    protected $name = 'order';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    // 追加属性
    protected $append = [];

    protected static function init()
    {
        self::afterWrite(function ($row) {
            $status = '';
            if (is_object($row)) {
                if (method_exists($row, 'getData')) {
                    $data = $row->getData();
                    $status = (string)($data['status'] ?? '');
                }
                if ($status === '' && isset($row->status)) {
                    $status = (string)$row->status;
                }
            }
            elseif (is_array($row)) {
                $status = (string)($row['status'] ?? '');
            }
            if ($status !== 'completed') {
                return;
            }
            $id = 0;
            if (is_object($row) && isset($row->id)) {
                $id = (int)$row->id;
            }
            elseif (is_array($row)) {
                $id = (int)($row['id'] ?? 0);
            }
            if ($id <= 0) {
                return;
            }
            $apiBase = config('site.api_base_url') ?: 'http://127.0.0.1:8000';
            $url = rtrim($apiBase, '/') . '/orders/' . $id . '/award-completion-points';
            $ctx = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/json\r\n",
                    'content' => '{}',
                    'timeout' => 15,
                    'ignore_errors' => true,
                ],
            ]);
            @file_get_contents($url, false, $ctx);
        });
    }
}
