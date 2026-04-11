import { useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '@/components/product-form-screen';

export default function EditProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return <ProductFormScreen productId={id} />;
}
