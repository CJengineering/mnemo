import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTable } from './products-table';
import { getProducts } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Database, FileText, Users, Plus, ImageIcon, Folder } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function ProductsPage(
  props: {
    searchParams: Promise<{ q: string; offset: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;
  const { products, newOffset, totalProducts } = await getProducts(
    search,
    Number(offset)
  );
let session = await auth();
  let user = session?.user;
  return (
<div>
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  

      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Jameel Content Management</h1>
            <p className="text-lg text-gray-600">
              Manage website content, media, and collections for the Community Jameel platform.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Build Page */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Build Page</CardTitle>
                  <CardDescription>Create and edit website pages with our page builder</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    <Link href={"/page-editor-test"}>Pages</Link>
                 
                  </Button>
                </CardContent>
              </Card>

              {/* Add Media Content */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg"> Media Content</CardTitle>
                  <CardDescription>Upload images, videos, and documents to the media library</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Folder className="w-4 h-4 mr-2" />
                    Media
                  </Button>
                </CardContent>
              </Card>

              {/* Manage Collection */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Folder className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Manage Collection</CardTitle>
                  <CardDescription>Organize and manage content collections and categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Comunity Jameel Collections
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
        

          {/* Quick Stats */}
      
        </div>
      </main>
    </div>

</div>
  );
}
