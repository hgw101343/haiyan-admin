import { useEffect, useState } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Image,
  Modal,
  Button,
  message,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { feedbackApi, type Feedback } from "../../api";

const { Title } = Typography;

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  /** 加载反馈列表 */
  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackApi.list();
      setFeedbacks((res as any).data || []);
    } catch {
      /* api 层已 toast */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  /** 标记已读 */
  const handleMarkRead = async (id: number) => {
    await feedbackApi.markRead(id);
    message.success("已标记为已读");
    loadFeedbacks();
  };

  const columns = [
    {
      title: "提交人",
      dataIndex: "user",
      key: "user",
      width: 120,
      render: (user: Feedback["user"]) =>
        user?.realName || user?.nickname || `用户#${user?.id}`,
    },
    {
      title: "反馈内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "图片",
      dataIndex: "images",
      key: "images",
      width: 120,
      render: (images: string[]) =>
        images && images.length > 0 ? (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewImages(images);
              setPreviewVisible(true);
            }}
          >
            查看({images.length})
          </Button>
        ) : (
          <Tag>无</Tag>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) =>
        status === "UNREAD" ? (
          <Tag color="red">未读</Tag>
        ) : (
          <Tag color="green">已读</Tag>
        ),
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_: unknown, record: Feedback) =>
        record.status === "UNREAD" ? (
          <Button type="link" onClick={() => handleMarkRead(record.id)}>
            标记已读
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Title level={4}>意见反馈</Title>
      <Card>
        <Table<Feedback>
          dataSource={feedbacks}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={600}
      >
        <Space wrap>
          {previewImages.map((url, i) => (
            <Image
              key={i}
              src={url}
              width={160}
              style={{ objectFit: "cover" }}
            />
          ))}
        </Space>
      </Modal>
    </>
  );
}
